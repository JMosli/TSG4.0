import { useAppSelector } from '@store/hooks';
import { getConfValue } from '@store/slice/config/configSlice';
import '@view/LanePage/components/LaneItem/index.css';
import { ClientWithVideo } from 'frontend-sdk/dist/client/types';
import { ObjectToCamel } from 'ts-case-convert/lib/caseConvert';
import { Image } from '@store/slice/cart/types';
import laneLogo from '@assets/lane-logo.png';

interface LaneItemProps {
  client: ObjectToCamel<ClientWithVideo> & {
    isSelected: boolean;
  };
  onLaneClick: (laneIndex: number) => void;
  index: number;
  isTV: boolean;
  autoPlay: boolean;
}

export const LaneItem = ({ client, onLaneClick, index, isTV = false, autoPlay = true }: LaneItemProps) => {
  const { config } = useAppSelector((state) => state.config);
  const maxImages = getConfValue<number>(config, 'ui.kiosk.display.photo_after_video') as number;
  const width = getConfValue<string>(config, 'ui.kiosk.display.card_size') as string
  const logo = getConfValue<string>(config, 'ui.kiosk.logo')

  return (
    <div className={`lane-item-wrapper`} key={client.id}>
      <div
        className="lane-item"
        onClick={() => onLaneClick(index)}
        style={{ width: width, borderRadius: isTV ? 10 : 'none' }}
      >
        <video
          src={`${import.meta.env.VITE_BACKEND_URL}/camera/recording/${client.videos[0].id}/video`}
          muted
          autoPlay={autoPlay}
          loop
          className="w-full flex-grow object-fill h-[220px]"
        ></video>

        {!isTV && <div className="lane-item-subtitle" style={{ padding: '5px', textAlign: 'center' }}>
          <span
            className="lane-item-subtitle-text"
            style={client.isSelected ? { color: 'green' } : {}}
          >
            Full video
          </span>
        </div>}
        <img
          src={logo ?? laneLogo}
          alt="logo"
          className="w-full h-full absolute opacity-25"
        />
      </div>
      {client.images && client.images.length > 0 && (
        <div className="flex flex-row line-item-image relative">
          {client.images
            .filter((item: Image, imgIndex: number) => imgIndex < maxImages)
            .map((item: Image, imgIndex: number) => {
              return (
                <div
                  onClick={() => onLaneClick(index)}
                  key={imgIndex}
                  style={{ width: width, position: 'relative' }}
                >
                  <img
                    className="w-full flex-grow object-fill h-[260px] rounded-[10px]"
                    src={item.image.frame}
                    alt="pictures"
                  />
                  <img
                    src={logo ?? laneLogo}
                    alt="logo"
                    className="w-full h-full absolute top-0 left-0 opacity-25 z-10"
                  />
                </div>
              );
            })}

        </div>
      )}
    </div>
  );
};
