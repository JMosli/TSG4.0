import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Video } from '@prisma/client';
import { readFile } from 'fs/promises';
import { RecordingService } from 'src/camera/recording/recording.service';
import { VideoService } from 'src/camera/recording/video.service';
import { ClientService } from 'src/client/client.service';
import { ConfigService } from 'src/config/config.service';
import { GlobalServerService } from 'src/global-server/global-server.service';
import { PaginateDto } from 'src/helpers/paginate/types';
import { KioskErrors } from 'src/kiosk/constants';
import { PrismaService } from '../helpers/prisma.service';
import { PaymentErrors } from './constants';
import { CreateSessionDto } from './dto/create-session.dto';
import { CheckoutCompletedEvent, WebhookEvent } from './types';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private readonly globalServer: GlobalServerService,
    private readonly videoService: VideoService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    private readonly recordingService: RecordingService,
  ) {}

  /**
   * Creates new payments session
   */
  async createSession(payload: CreateSessionDto, kioskId?: number) {
    await this.clientService.findOne({ id: { in: payload.client_ids } });
    const clientVideos = await this.videoService.find({
      clientId: {
        in: payload.client_ids,
      },
      is_sold: false,
    });
    const kiosk = await this.prisma.kiosk.findFirst({
      where: { id: kioskId },
      include: { terminal: true },
    });
    if (!kiosk && kioskId)
      throw new NotFoundException(KioskErrors.KioskNotFound);

    let videos = clientVideos.items;
    let photos = payload.photos;
    const photoClients = [
      ...new Set(payload.photos?.map((p) => p.client_id) ?? []),
    ];

    if (payload.video_ids) {
      const requestedVideos = await this.videoService.find({
        id: {
          in: payload.video_ids,
        },
        clientId: {
          in: payload.client_ids,
        },
        is_sold: false,
      });
      videos = requestedVideos.items;
    }

    // checking each client for a full video
    // and removing a client from photos if he does not have
    // a full video to take photo from
    for (const client of photoClients) {
      const fullVideo = await this.videoService.find({
        clientId: client,
        is_full: true,
        is_sold: false,
      });
      if (!fullVideo) {
        photos = photos.filter((p) => p.client_id !== client);
      }
    }

    if (videos.length === 0 && photos.length === 0)
      throw new NotFoundException(PaymentErrors.VideosNotFound);

    const [videoBasePrice, videoDurationCoef, photoBasePrice] =
      await this.configService.getMany<[number, number, number]>(
        [
          'payment.video.base_price',
          'payment.video.duration_coef',
          'payment.photo.base_price',
        ],
        { throws: true },
      );

    // creating a session in the database first to obtain id
    // and important uid
    const session = await this.prisma.paymentSession.create({
      data: {
        photos,
        active: true,
        video_ids: videos.map((v) => v.id),
        clients: {
          connect: payload.client_ids.map((id) => ({ id })),
        },
        kiosk: kioskId
          ? {
              connect: {
                id: kioskId,
              },
            }
          : undefined,
      },
    });

    const photoPrice = photoBasePrice.value * photos.length;
    const videoPrice =
      videoBasePrice.value * videos.length +
      videoDurationCoef.value *
        videos.map((v) => v.duration).reduce((acc, v) => acc + v, 0);
    const price = Math.round((photoPrice + videoPrice) / 100) * 100;

    // then getting payment link from the global backend
    const response = await this.globalServer.communicator.payment.createSession(
      {
        price,
        session_uid: session.uid,
        email: payload.email,
        reader_id: kiosk?.terminal?.reader_id,
      },
    );

    if (!response) {
      await this.prisma.paymentSession.delete({ where: { id: session.id } });
      throw new InternalServerErrorException(PaymentErrors.GlobalServerError);
    }

    const [link, error] = response.transpose();

    // if global backend returned error, we need to backup all changes made
    // into the database and return an error
    if (error) {
      await this.prisma.paymentSession.delete({ where: { id: session.id } });
      throw new InternalServerErrorException(PaymentErrors.GlobalServerError);
    }

    return { session, link };
  }

  /**
   * Retrieves one payment session
   * @throws {NotFoundException} if session was not found
   */
  async findSession(where: Prisma.PaymentSessionWhereInput) {
    const session = this.prisma.paymentSession.findFirst({ where });
    if (!session)
      throw new NotFoundException(PaymentErrors.PaymentSessionNotFound);

    return session;
  }

  /**
   * Finds multiple payment sessions
   */
  async findSessions(
    where: Prisma.PaymentSessionWhereInput,
    pagination?: PaginateDto,
  ) {
    const [count, items] = await this.prisma.$transaction([
      this.prisma.paymentSession.count({ where }),
      this.prisma.paymentSession.findMany({
        where,
        skip: pagination?.skip ?? undefined,
        take: pagination?.take ?? undefined,
      }),
    ]);

    return { count, items };
  }

  /**
   * Updates all sessions with the specified parameters
   */
  async updateSession(
    where: Prisma.PaymentSessionWhereInput,
    data: Prisma.PaymentSessionUpdateInput,
  ) {
    return this.prisma.paymentSession.updateMany({
      where,
      data,
    });
  }

  /**
   * Handles an incoming payment event
   */
  async handleWebhook({ event, _internal }: WebhookEvent) {
    //@ts-expect-error
    if (!_internal.check) {
      throw new BadRequestException(PaymentErrors.GlobalServerError);
    }

    if (event.type === 'checkout.session.completed') {
      return await this.handleSessionCompleted(event);
    }

    return { success: false };
  }

  /**
   * Handles checkout completed event
   * @throws {BadRequestException} if session is not active
   */
  private async handleSessionCompleted(event: CheckoutCompletedEvent) {
    const session = await this.findSession({ uid: event.data.session_uid });
    if (!session.active)
      throw new BadRequestException(PaymentErrors.PaymentSessionNotActive);

    // making session not active (so its completed)
    await this.updateSession({ id: session.id }, { active: false });

    // and sending this information into the backend
    this.eventEmitter.emit('payment.checkout_completed', event.data);

    const communicator = this.globalServer.communicator;
    const photoClients = new Set(session.photos.map((p) => p.client_id));

    // removing a bought photo from shots array
    // not for a frontend to reommend this photo again
    for (const client of photoClients) {
      const fullVideo: Video | null = await this.videoService
        .findOne({
          clientId: client,
          is_full: true,
        })
        .catch(() => null);
      if (!fullVideo) continue;

      const photos = [...session.photos].filter((p) => p.client_id === client);

      await this.prisma.video.update({
        where: {
          id: fullVideo.id,
        },
        data: {
          metadata: {
            ...fullVideo.metadata,
            shots: fullVideo.metadata.shots?.filter((s) =>
              photos.find((p) => p.timestamp.toString() !== s),
            ),
          },
        },
      });
    }

    // uploading all photos to the global server
    await Promise.all(
      session.photos.map(async (frame) => {
        const fullVideo = await this.videoService.findOne({
          clientId: frame.client_id,
          is_full: true,
        });
        const screenshot = await this.recordingService.getFrame(
          fullVideo.id,
          frame.timestamp,
        );

        await communicator.photo
          .upload(screenshot, {
            payment_uid: event.data.global_session_uid,
          })
          .catch(() => null);
      }),
    );

    // uploading all bought videos to the global backend
    await Promise.all(
      session.video_ids.map(async (videoId) => {
        const video = await this.videoService.findOne({ id: videoId });
        const buff = await readFile(video.path);
        await communicator.video
          .upload(buff, {
            payment_uid: event.data.global_session_uid,
            local_id: video.id,
          })
          .catch(() => null);
        await this.videoService.removeVideo({ id: videoId });
        console.log(`uploaded ${videoId}`);
      }),
    );

    // and marking all bought videos as sold
    await this.prisma.video.updateMany({
      where: {
        id: {
          in: session.video_ids,
        },
      },
      data: {
        sold_at: new Date(),
        is_sold: true,
      },
    });

    return { success: true };
  }
}
