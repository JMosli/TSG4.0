import '@component/MomentItem/index.css';
import { CartItem, Image, isImage, isVideo, Video } from '@store/slice/cart/types';
import { ChangeEvent, useState } from 'react';
import { getConfValue } from '@store/slice/config/configSlice';
import { useAppSelector } from '@store/hooks';
import laneLogo from '@assets/lane-logo.png';

interface MomentItemProps {
  item: Video | Image;
  handlerCheckbox: (e: ChangeEvent<HTMLInputElement>, item: Video | Image) => void
}

export const MomentItem = ({ item, handlerCheckbox }: MomentItemProps) => {

  const { config } = useAppSelector((state) => state.config);
  const durationCoef = Number(getConfValue<string>(config, 'payment.video.duration_coef')) || 0;
  const basePrice = Number(getConfValue<string>(config, 'payment.video.base_price')) || 0;
  const imagePrice = Number(getConfValue(config, 'payment.photo.base_price')) || 0;
  const logo = getConfValue<string>(config, 'ui.kiosk.logo')

  const [ previewVisible, setPreviewVisible ] = useState(false);

  const handlerCheckboxChange = (e: ChangeEvent<HTMLInputElement>, item: Video | Image) => {
    handlerCheckbox(e, item)
  };

  const handlePreviewClick = () => {
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
  };

  return (
    <>
      <div onClick={handlePreviewClick} className="card relative">
        {isVideo(item) && (
          <>
            <video
              style={{ borderRadius: 10 }}
              src={`${import.meta.env.VITE_BACKEND_URL}/camera/recording/${
                'video' in item && item.video.id
              }/video`}
              autoPlay
              muted
              loop
              className="w-full flex-grow object-fill"
            ></video>
            <span className="text-3xl text-yellow-400 mr-5 font-extrabold absolute bottom-3 right-0">
            {`$${Math.round(
              (Number(item.video.duration) * durationCoef + basePrice
              ) / 100)}`}
          </span>
          </>
        )}
        {
          isImage(item) && (
            <>
              <img
                className="w-full h-auto object-cover"
                src={(item as Image).image.frame}
                alt="Frame"
                style={{ borderRadius: 10 }}
              />
              <span className="text-3xl text-yellow-400 mr-5 font-extrabold absolute bottom-3 right-0">
              {`$${Math.round(imagePrice / 100)}`}
            </span>
            </>
          )
        }
        <div>
          <input
            onChange={(event: ChangeEvent<HTMLInputElement>) => handlerCheckboxChange(event, item)}
            type="checkbox" className="p-10 h-14 w-14 absolute right-3 top-3 z-40 bg-white text-white"
            style={{ borderRadius: 10 }}/>
        </div>

        <img
          src={logo ?? laneLogo}
          alt="logo"
          className="w-full h-full absolute top-0 left-0 opacity-25 z-10"
        />
      </div>

      {previewVisible && (
        <div className="image-modal">
          <div className="image-modal-window">
            <div className="flex-row justify-between items-center d-flex w-full mb-2 flex">
              <div className="flex-row flex"></div>
              <span className="image-modal-header">Tap again to minimize</span>
            </div>
            <div
              className="image-overlay relative"
              onClick={closePreview}
              style={{ borderColor: 'rgba(167, 255, 137, 0.5)' }}
            >
              {isVideo(item) && (
                <video
                  style={{ width: '100%', borderRadius: 10 }}
                  src={`${import.meta.env.VITE_BACKEND_URL}/camera/recording/${item.video.id}/video`}
                  muted
                  autoPlay
                  controls
                  loop
                ></video>
              )}
              {isImage(item) && (
                <img
                  style={{ width: '100%', borderRadius: 10 }}
                  src={(item as Image).image.frame}
                  alt="Frame"
                />
              )}
              <img
                src={logo ?? laneLogo}
                alt="logo"
                className="w-full h-full absolute top-0 left-0 opacity-25 z-10"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
