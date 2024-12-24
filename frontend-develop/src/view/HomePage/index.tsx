import '@view/HomePage/index.css';
import qrCode from '@assets/qr-code.png';
import { getConfValue } from '@store/slice/config/configSlice';
import { useAppSelector } from '@store/hooks';
import useClients from '@utils/hooks/useClients';
import { useEffect, useRef, useState } from 'react';
import { LaneContext } from '@view/LanePage';
import { LaneItemsList } from '@view/LanePage/components';
import { BuyPlayer } from '@component/BuyPlayer';
import useLocalApi from '@utils/hooks/useLocalApi';


export const HomePage = () => {
  const api = useLocalApi();
  const { config } = useAppSelector((state) => state.config);
  const laneItemsRef = useRef<HTMLDivElement>(null);

  const [ currentLaneIndex, setCurrentLaneIndex ] = useState<number>(0);
  const [ currentMediaIndex, setCurrentMediaIndex ] = useState<number>(0);
  const [ isVideoPlaying, setIsVideoPlaying ] = useState<boolean>(true);
  const [ timer, setTimer ] = useState<number>(20);
  const [ time, setTime ] = useState<number>(20000);

  const [ clients ] = useClients({ onFaceRecognize: () => null });
  const [ token, setToken ] = useState<string>('');

  const maxImages = getConfValue<number>(config, 'ui.tv.display.photo_after_video') as number;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 20));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!clients?.items?.length) return;

    const interval = setInterval(() => {
      setTimer(20);
      const currentClient = clients.items[currentLaneIndex];
      const fullVideoIndex = currentClient.videos.findIndex((video: any) => video.isFull);
      const totalMediaCount =
        (fullVideoIndex !== -1 ? 1 : 0) +
        Math.min(maxImages, currentClient.images.length);

      if (isVideoPlaying) {
        setIsVideoPlaying(false);
        setCurrentMediaIndex(0);
      } else if (currentMediaIndex + 1 < totalMediaCount) {
        setCurrentMediaIndex((prevIndex) => prevIndex + 1);
      } else {
        setIsVideoPlaying(true);
        setCurrentMediaIndex(0);
        setCurrentLaneIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % clients.items.length;
          if (nextIndex === 0) {
            setTimer(0);
          }
          return nextIndex;
        });
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [ clients?.items, currentLaneIndex, currentMediaIndex, isVideoPlaying, maxImages ]);

  useEffect(() => {
    if (!clients) return
    const currentClient = clients?.items?.[currentLaneIndex];
    if (currentClient?.id && isVideoPlaying) {
      api.tv.videoToken(currentClient.id, currentClient.videos[currentMediaIndex].id).then(({ response }: any) => {
        setToken(response.token);
      });
    }
    if (currentClient?.id && !isVideoPlaying) {
      api.tv.frameToken(currentClient.id, Number(currentClient.images[currentMediaIndex].image.shot)).then(({ response }: any) => {
        setToken(response.token);
      });
    }
  }, [ currentLaneIndex, clients, currentMediaIndex ]);

  if (!clients) return <>Loading...</>;

  const currentClient = clients.items[currentLaneIndex];
  const currentMedia = isVideoPlaying
    ? currentClient.videos[currentMediaIndex]
    : currentClient.images[currentMediaIndex];

  return (
    <LaneContext.Provider value={currentClient}>
      <div className="home-page">
        {clients.items.length && <BuyPlayer media={currentMedia} timer={timer} token={token}/>}
        <div className="lane-wrapper requires-no-scroll">
          <div className="lane-section">
            <LaneItemsList
              lanes={clients.items}
              ref={laneItemsRef}
              isTV={true}
              autoPlay={false}
              onLaneClick={() => {
              }}
            />
          </div>
        </div>
        <div className="home-shooting-gallery">
          <img
            src={getConfValue<string>(config, 'ui.kiosk.logo') ?? ''}
            alt=""
            className="w-32 h-32"
          />
        </div>
      </div>
    </LaneContext.Provider>
  );
};
