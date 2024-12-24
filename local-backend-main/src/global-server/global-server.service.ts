import { Injectable, Logger } from '@nestjs/common';
import { CommunicatorRequester } from 'communicator/requester';
import { RangeService } from 'src/range/range.service';
import { GlobalCommunicator } from './communicator';

@Injectable()
export class GlobalServerService {
  private readonly logger = new Logger(GlobalServerService.name);

  communicator: GlobalCommunicator;

  constructor(private readonly rangeService: RangeService) {
    this.createCommunicator();
  }

  /**
   * Creates new global server communicator and saves it into
   * GlobalServerService.communicator variable
   * @returns created communicator
   */
  async createCommunicator() {
    const range = await this.rangeService.getDefault().catch(() => null);
    if (!range) {
      return this.logger.warn(
        'could not create communicator: default range does not exist',
      );
    }
    if (!process.env.GLOBAL_SERVER_API)
      throw new Error(
        'Could not start: env.GLOBAL_SERVER_API not found.' +
          'Please add this variable into the .env file',
      );

    if (this.communicator)
      return this.logger.warn('communicator is already created');

    const requester = new CommunicatorRequester({
      rangeId: range.global_id.toString(),
      checkerKey: range.public_key_checker,
      signerKey: range.private_key_signer,
      baseURL: process.env.GLOBAL_SERVER_API,
    });

    this.logger.debug(
      'continuing in normal mode: default range exists - communicator created',
    );

    return (this.communicator = new GlobalCommunicator(requester));
  }
}
