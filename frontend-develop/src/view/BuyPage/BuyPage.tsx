import '@view/BuyPage/BuyPage.css';
import { BuyMediaForm } from '@component';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@component';
import { MomentList } from '@component';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import React, { EventHandler, useEffect, useRef, useState } from 'react';
import payment from '@assets/fluent--payment-32-regular.png';
import QRCode from 'react-qr-code';
import { ObjectToCamel } from 'ts-case-convert/lib/caseConvert';
import { CreatePaymentResponse } from 'frontend-sdk/dist/payment/types';
import { CheckoutCompleteEvent } from './types';
import { CartItem, Image, isImage, isVideo, Video } from '@store/slice/cart/types';
import { removeFromCart } from '@store/slice/cart/cartSlice';

export const BuyPage = () => {
  const { cart } = useAppSelector((state) => state.cart);
  const ws = useAppSelector((state) => state.ws.payment);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [ step, setStep ] = useState<'prep' | 'qr'>('prep');
  const [ payment, setPayment ] = useState<ObjectToCamel<
    CreatePaymentResponse & { email: string }
  > | null>(null);
  const [ items, setItems ] = useState<CartItem[]>([])

  const paymentRef = useRef<typeof payment>(null);

  const onComplete = (event: CheckoutCompleteEvent) => {
    if (!paymentRef.current) return;
    if (paymentRef.current.session.uid !== event.session_uid) return;

    navigate('/thanks', {
      state: {
        event,
        payment: paymentRef.current,
      },
    });
  };

  const handlerCheckbox = (
    e: React.ChangeEvent<HTMLInputElement>,
    item: Video | Image
  ) => {
    const isChecked: boolean = e.target.checked;
    setItems((prevItems: CartItem[]) => {
      if (isChecked) {
        const alreadyExists = prevItems.some((existingItem: CartItem) =>
          existingItem.client === item.client &&
          ((isVideo(item) && isVideo(existingItem) && existingItem.video.id === item.video.id) ||
            (isImage(item) && isImage(existingItem) && existingItem.image.shot === item.image.shot))
        );

        if (!alreadyExists) {
          return [ ...prevItems, item ];
        }
      } else {
        return prevItems.filter((existingItem: CartItem) =>
          !(
            existingItem.client === item.client &&
            ((isVideo(item) && isVideo(existingItem) && existingItem.video.id === item.video.id) ||
              (isImage(item) && isImage(existingItem) && existingItem.image.shot === item.image.shot))
          )
        );
      }
      return prevItems;
    });
  };

  useEffect(() => {
    // dispatch(logPaymentVisitor());\
    ws.on('payment.checkout_completed', onComplete);

    return () => {
      ws.removeListener('payment.checkout_completed', onComplete);
    };
  }, []);

  useEffect(() => {
    paymentRef.current = payment;
  }, [ payment ]);

  return (
    <div className="buy-section">
      <div className="buy-main">
        <div className="buy-selected-files">
          <div className="buy-selected-files-header">
            <p className="buy-selected-files-header-title">Selected files</p>
            <Button
              icon="plus"
              iconPosition="left"
              text={'Add media for the other lane'}
              onClick={() => {
                navigate('/lane');
              }}
            />
            <Button
              isButtonEnabled={cart.length > 0}
              variant={cart.length > 0 ? 'enabled' : 'disabled'}
              text={'Remove from cart'}
              onClick={() => {
                dispatch(removeFromCart(items))
              }}
            />
          </div>
          <div className="buy-lanes">
            <MomentList cart={cart} handlerCheckbox={handlerCheckbox}/>
          </div>
        </div>
        {step === 'prep' && (
          <BuyMediaForm
            onCreated={(payment) => {
              setPayment(payment);
              setStep('qr');
            }}
          />
        )}
        {step === 'qr' && payment && (
          <div className="buy-media flex flex-col gap-2 justify-center items-center">
            <span className="icon-[fluent--payment-32-regular] bg-neutral-300 w-32 h-32"></span>
            {payment.link.url ?
              (<>
                <QRCode value={payment.link.url}/>
                <span className="text-black text-3xl">
                  Use this QR code to make a payment
                </span>
              </>) : (
                <span className="text-black text-3xl mb-4">
                 Continue payment at the terminal
                </span>
              )
            }
            <Button
              text="Back"
              onClick={() => {
                setStep('prep');
                setPayment(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
