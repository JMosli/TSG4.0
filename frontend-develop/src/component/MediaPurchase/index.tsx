import React from 'react';
import QRCode from 'react-qr-code';
import '@component/MediaPurchase/index.css';
import arrow from '@assets/arrow-many.png'
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';

interface MediaPurchaseProps {
  qrValue: string;
  timer: number;
}

export const MediaPurchase: React.FC<MediaPurchaseProps> = ({ qrValue, timer }) => {

  const percentage = (timer / 20) * 100;
  const getTimerColor = (time: number): string => {
    if (time > 15) return '#45B400';
    if (time > 10) return '#B4B400';
    if (time > 5) return '#B46F00';
    return '#B41B00';
  };
  return (
    <div className="media-purchase">
      <h2 className="media-purchase-title">Do you want buy this media file?</h2>
      <div className="media-purchase-qr-container">
        <QRCode value={`${import.meta.env.VITE_GLOBAL_FRONTEND_URL}/bm?t=${qrValue}`} size={300}/>
      </div>
      <div className="media-purchase-timer">
        <div className="media-purchase-timer">
          <div style={{ width: 120, height: 120, transform: 'scale(-1, 1)', position: 'relative' }}>
            <CircularProgressbar
              strokeWidth={10}
              value={percentage}
              styles={buildStyles({
                pathColor: getTimerColor(timer),
                trailColor: '#333333',
                textColor: getTimerColor(timer),
                textSize: '36px',
              })}
            />
            <div
              className="timer"
              style={{color: getTimerColor(timer)}}
            >
              {timer}
            </div>
          </div>
        </div>
      </div>
      <div className="media-purchase-next">
        <div className="mr-3">next snippet</div>
        <div>
          <img src={arrow} alt="arrow" width={110}/>
        </div>
      </div>
    </div>
  );
};
