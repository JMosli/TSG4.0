import '@view/ThankYouPaymentPage/ThankYouPaymentPage.css';
import { Tip } from '@component';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import thankYou from '@assets/thank-you-logo.png';
import { CreatePaymentResponse } from 'frontend-sdk/dist/payment/types';
import { useAppSelector } from '@store/hooks';
import { getConfValue } from '@store/slice/config/configSlice';
import QRCode from 'react-qr-code';
import logo from '@assets/msc-small-logo.png';
import { useEffect } from 'react';

export const ThankYouPaymentPage = () => {
  const { config } = useAppSelector((state) => state.config);
  const {
    state: { payment },
  }: { state: { payment: CreatePaymentResponse & { email: string } } } =
    useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const backTimeout = getConfValue<number>(
      config,
      'ui.kiosk.payment.go_back_timeout'
    )!;

    const timeout = setTimeout(() => {
      navigate('/lane');
    }, backTimeout * 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [ config ]);

  if (!payment) return <Navigate to="/lane"/>;

  return (
    <div className="thank-you">
      <div className="thank-you-section">
        <div className="thank-you-header">
          <img
            src={getConfValue(config, 'ui.kiosk.logo') ?? logo}
            alt="thank-you-logo"
            className="w-96"
          />
          <div className="thank-you-header-text">
            <span className="thank-you-header-text-thank">Thanks you</span>
            <span className="thank-you-header-text-payment">
              {getConfValue<string>(config, 'ui.kiosk.thank_you.title')!}
            </span>
          </div>
        </div>
        <span className="thank-you-info" style={{width: '80%'}}>
          {getConfValue<string>(config, 'ui.kiosk.thank_you.description')!}
        </span>
        <span className="thank-you-email">{payment.email}</span>
        <div className="thank-you-line"></div>
        <div className="thank-you-tips">
          <Tip
            text={
              'If you don’t see your media in 5 minutes please check your junk mail'
            }
          />
          <Tip
            text={
              'If you still have not received your media please contact us on:'
            }
          />
        </div>
        <div className="thank-you-contact-email mb-2">
          <span>theshootinggallery2020@gmail.com</span>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <Tip text="You can also get your media by scanning the QR code:"/>
          <QRCode
            value={`${import.meta.env.VITE_GLOBAL_FRONTEND_URL}/payment/${
              payment.link.uid
            }`}
          />
        </div>
        <div
          className="thank-you-select-more cursor-pointer"
          onClick={() => navigate('/lane')}
        >
          <span>Return to home page</span>
        </div>
      </div>
    </div>
  );
};
