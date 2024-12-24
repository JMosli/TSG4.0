import '@component/BuyPlayer/index.css';
import React, { useRef } from 'react';
import laneLogo from '@assets/lane-logo.png';
import { getConfValue } from '@store/slice/config/configSlice';
import { useAppSelector } from '@store/hooks';
import { MediaPurchase } from '@component/MediaPurchase';
import { isImage } from '@store/slice/cart/types';

interface BuyPlayerProps {
  media: any,
  timer: number;
  token: string;
}

export const BuyPlayer: React.FC<BuyPlayerProps> = ({ media, timer, token }) => {
  const { config } = useAppSelector((state) => state.config);
  const logo = getConfValue<string>(config, 'ui.kiosk.logo')

  const modalRef = useRef<HTMLDivElement>(null);
  if (!media) return null;

  return (
    <div
      ref={modalRef}
      className="image-modal">
      <div className="flex" style={{ maxHeight: '85%' }}>
        <div className="image-modal-window" style={{position: 'relative'}}>
          {!isImage(media) && (
            <video
              src={`${import.meta.env.VITE_BACKEND_URL}/camera/recording/${media?.id}/video`}
              muted
              autoPlay
              controls
              loop
              style={{ maxHeight: '100%'}}
            ></video>
          )}
          {isImage(media) && (
            <img
              src={media.image.frame}
              alt="pictures"
              style={{ maxHeight: '100%' }}
            />
          )}
          <img
            src={logo ?? laneLogo}
            alt="logo"
            className="w-full h-full absolute opacity-25"
          />
        </div>
        <MediaPurchase qrValue={token} timer={timer}/>
      </div>
    </div>
  )
}
