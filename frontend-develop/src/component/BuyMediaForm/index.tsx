import { Link } from 'react-router-dom';
import { useState } from 'react';
import '@component/BuyMediaForm/BuyMediaForm.css';
import photo from '@assets/photo.png';
import video from '@assets/video.png';
import { ObjectToCamel } from 'ts-case-convert/lib/caseConvert';
import { CreatePaymentResponse } from 'frontend-sdk/dist/payment/types';
import { ButtonLoading } from '@component/ButtonLoading';
import useLocalApi from '@utils/hooks/useLocalApi';
import { useAppSelector } from '@store/hooks';
import { getConfValue } from '@store/slice/config/configSlice';
import { CartItem, isImage, isVideo } from '@store/slice/cart/types';

type Props = {
  onCreated: (
    payment: ObjectToCamel<CreatePaymentResponse & { email: string }>
  ) => void;
};

export const BuyMediaForm = ({ onCreated }: Props) => {
  const api = useLocalApi();
  const { config } = useAppSelector((state) => state.config);
  const { cart } = useAppSelector((state) => state.cart);

  const durationCoef = Number(getConfValue<string>(config, 'payment.video.duration_coef')) || 0;
  const basePrice = Number(getConfValue<string>(config, 'payment.video.base_price')) || 0;
  const imagePrice = Number(getConfValue(config, 'payment.photo.base_price')) || 0;


  const [ error, setError ] = useState('');
  const [ email, setEmail ] = useState('');
  const [ checkbox, setCheckbox ] = useState(true);

  const handleEmailChange = (e: any) => {
    setEmail(e.target.value);
  };

  const handleCheckboxChange = (e: any) => {
    setCheckbox(e.target.checked);
  };

  const handleIsDataValid = () => {
    const regex = new RegExp('^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$');
    return regex.test(email) && checkbox;
  };

  function getDataForPayment(cartItems: CartItem[]) {
    const clientIds: number[] = [];
    const videoIds: number[] = [];
    const photos: { timestamp: number; client_id: number }[] = [];

    cartItems.forEach(item => {
      if (isVideo(item)) {
        clientIds.push(item.client);
        videoIds.push(item.video.id);
      }
      if (isImage(item)) {
        clientIds.push(item.client);
        photos.push({ timestamp: item.image.shot, client_id: item.client });
      }
    });

    const uniqueClientIds = [...new Set(clientIds)];
    const uniqueVideoIds = [...new Set(videoIds)];

    return {
      client_ids: uniqueClientIds,
      video_ids: uniqueVideoIds,
      photos: photos
    };
  }

  const paymentData = getDataForPayment(cart);

  const handlePurchase = async () => {
    if (!handleIsDataValid())
      return setError('Fill all inputs and check the consent checkbox');

    const [ response, error ] = (
      await api.payment.create({
        email: email,
        client_ids: paymentData.client_ids,
        video_ids: paymentData.video_ids,
        photos: paymentData.photos
      })
    ).transpose();
    if (error) return setError(error.message as string);

    onCreated({ ...response, email });
  };

  const handlerTotal = () => {
    return cart.reduce((total: number, item: CartItem) => {
      if (isVideo(item)) {
        const videoPrice = Math.round(
          Math.round(item.video.duration) * durationCoef + basePrice
        );
        return total + videoPrice;
      }
      if (isImage(item)) {
        return total + imagePrice;
      }
      return total;
    }, 0);
  };

  return (
    <div className="buy-media">
      <p className="buy-media-header-title">Buy media</p>
      <div className="buy-media-main">
        <div className="buy-media-header">
          <img src={photo} alt="photo"/>
          <img src={video} alt="video"/>
        </div>
        <div className="buy-media-main-text">
          <span>
            <b>{cart.length}</b> Media files selected
          </span>
        </div>
        <div className="buy-media-main-input">
          <div className="buy-media-main-input-title">
            Where should we send the files?
          </div>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="example@domain.com"
            required
          />
          <div className="buy-media-main-check">
            <input
              type="checkbox"
              checked={checkbox}
              onChange={handleCheckboxChange}
              className="buy-media-main-checkbox"
            />
            <span className="buy-media-main-check-text">
              I consent to TSG using my media
            </span>
          </div>
          {error && <b className="text-red-600 text-2xl">{error}</b>}
          <div className="buy-media-line"></div>
          <div className="buy-media-order">
            <div className="buy-media-order-total">
              <span className="buy-media-order-total-text">Total:</span>
              <span className="buy-media-order-total-money">
                ${Math.round(handlerTotal() / 100)}
              </span>
            </div>
            <div className="buy-media-order-button">
              <ButtonLoading
                onClick={handlePurchase}
                className="bg-transparent border-none"
              >
                <span className="buy-media-order-button-text">
                  Make payments
                </span>
              </ButtonLoading>
            </div>
            <div className="buy-media-back-continue-buttons">
              <Link to="/lane">
                <div className="buy-media-back-continue-button">
                  <span>{'< '}Back</span>
                </div>
              </Link>
              <div className="buy-media-back-continue-button">
                <span>Cancel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
