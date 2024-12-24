import { ClientWithVideo } from 'frontend-sdk/dist/client/types';
import { Paginated, PaginationRequest } from 'frontend-sdk/dist/types';
import { useState, useRef, useEffect } from 'react';
import { ObjectToCamel } from 'ts-case-convert/lib/caseConvert';
import useLocalApi from './useLocalApi';
import { FaceRecognizeResult } from '@view/LanePage/types';
import { Observable, bufferTime, filter } from 'rxjs';
import { useAppSelector } from '@store/hooks';
import { TYPES } from '@store/slice/cart/enum';
import { Image } from '@store/slice/cart/types';

export type Client = ObjectToCamel<ClientWithVideo> & {
  isSelected: boolean;
};

export default function useClients(
  {
    onFaceRecognize: _onFaceRecognize,
  }: {
    onFaceRecognize: (index: number) => void;
  }): [ Paginated<ObjectToCamel<ClientWithVideo> & {
  isSelected: boolean
}> | null, string, (id: number, selected: boolean) => void, () => Promise<void> ] {
  const api = useLocalApi();
  const { camera } = useAppSelector((state) => state.ws);

  const [ clients, setClients ] = useState<Paginated<Client> | null>(null);
  const [ error, setError ] = useState('');

  const clientsRef = useRef<typeof clients>(null);

  const loadClients = async (socket = false) => {
    try {
      const skip = socket ? 0 : (clientsRef.current?.items.length ?? 0)
      const res = await api.client.list(<PaginationRequest>{ skip: skip, take: 20 });
      const [ responseClients, responseError ] = res.transpose();

      if (responseClients && responseClients.items.some(item => item !== null)) {
        const clientItems = responseClients.items.filter((client) => client.videos.length);

        const updatedItems = await Promise.all(clientItems.map(async (client) => {
          const fullVideo = client.videos.find((video: any) => video.isFull);

          if (!fullVideo) {
            return {
              ...client,
              images: [],
              isSelected: false,
              isProcessing: false,
            };
          }

          const frames: Image[] = [];
          for (const shot of fullVideo.metadata.shots) {
            const frame: any = await api.camera.frame.getVideoFrame(fullVideo.id, Number(shot));
            frames.push({
              client: client.id,
              image: {
                frame,
                shot: Number(shot),
              },
              type: TYPES.IMAGE,
            });
          }

          return {
            ...client,
            images: frames,
            isSelected: false,
            isProcessing: false,
          };
        }));

        setClients((prevState) => ({
          count: responseClients.count,
          items: [ ...(prevState?.items ?? []), ...updatedItems ],
        }));
      } else {
        setError(responseError?.message as string);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('An error occurred while loading clients.');
    }
  };

  useEffect(() => {
    clientsRef.current = clients;
  }, [ clients ]);

  const onFaceRecognize = (events: FaceRecognizeResult[]) => {
    const event = events
      .filter((e) => e.similarity.similarity !== 1)
      .sort((a, b) => b.similarity.similarity - a.similarity.similarity)
      .at(0);
    if (!event) return;

    const index = clientsRef.current?.items.findIndex(
      (c) => c.id === event.client.id
    );
    if (index === -1 || index === undefined) return;

    console.log('opening');

    _onFaceRecognize(index);
  };

  useEffect(() => {
    loadClients(true);

    camera.on('camera.client.processing_finished', loadClients);
    camera.on("payment.checkout_completed", loadClients)
    const recognitionObservable = new Observable<FaceRecognizeResult>(
      (subscriber) => {
        camera.on(
          'face_recognizer.recognize.finished',
          subscriber.next.bind(subscriber)
        );

        return function unsubscribe() {
          camera.removeListener(
            'face_recognizer.recognize.finished',
            subscriber.next
          );
        };
      }
    );


    // Waiting some time for all events to arrive and then
    // for us to select the right event
    const recognitionSub = recognitionObservable
      .pipe(
        bufferTime(500),
        filter((events) => events.length > 0)
      )
      .subscribe(onFaceRecognize);

    return () => {
      camera.removeListener('camera.client.processing_finished', loadClients);
      camera.removeListener('payment.checkout_completed', loadClients);
      recognitionSub.unsubscribe();
    };
  }, []);

  const selectClient = (id: number, selected: boolean) => {
    setClients((clients) => ({
      count: clients!.count,
      items: clients!.items.map((c) => {
        if (c.id !== id) {
          return c;
        }
        return {
          ...c,
          isSelected: selected,
        };
      }),
    }));
  };

  return [ clients, error, selectClient, loadClients ];
}
