import '@component/ImageOverlay/ImageOverlay.css';
import { useContext, useEffect, useRef, useState } from 'react';
import arrow from '@assets/arrow-lane.png';
import { LaneContext } from '@view/LanePage';
import { Button } from '@component';
import { useAppSelector } from '@store/hooks';
import { getConfValue } from '@store/slice/config/configSlice';
import { CartItem, isImage, isVideo } from '@store/slice/cart/types';
import { TYPES } from '@store/slice/cart/enum';
import useLocalApi from '@utils/hooks/useLocalApi';
import laneLogo from '@assets/lane-logo.png';

type Props = {
  onAccept: (c: any) => void;
  onClose: () => void;
  isVisible: boolean;
};

export const ImageOverlay = (
  {
    isVisible,
    onAccept,
    onClose
  }: Props) => {
  const currentLane = useContext(LaneContext);
  const api = useLocalApi();
  const { config } = useAppSelector((state) => state.config);
  const { cart } = useAppSelector((state) => state.cart);

  const modalRef = useRef<HTMLDivElement>(null);
  const durationCoef = Number(getConfValue<string>(config, 'payment.video.duration_coef')) || 0;
  const basePrice = Number(getConfValue<string>(config, 'payment.video.base_price')) || 0;
  const imagePrice = Number(getConfValue(config, 'payment.photo.base_price')) || 0;
  const pools = getConfValue(config, 'ui.kiosk.poll') || [];
  const poolEnabled = getConfValue(config, 'ui.kiosk.poll.enabled') as boolean;
  const logo = getConfValue<string>(config, 'ui.kiosk.logo')

  const videoRef = useRef(null);

  const [ variantVideo, setVariantVideo ] = useState<'enabled' | 'disabled' | 'active'>('enabled');
  const [ variantImage, setVariantImage ] = useState<'enabled' | 'disabled' | 'active'>('enabled');
  const [ activeMode, setActiveMode ] = useState<'all' | 'videos' | 'images'>('all');
  const [ index, setIndex ] = useState(0);
  const [ isShowingImages, setIsShowingImages ] = useState(false);
  const [ isAnswer, setIsAnswer ] = useState<boolean>(cart.some((item: CartItem) => {
    if (item.client !== currentLane?.id) return false;
    if (isVideo(item) && currentLane.videos[index]) {
      return item.video.id === currentLane.videos[index].id;
    }
    if (isImage(item) && currentLane.images[index]) {
      return item.image.shot === currentLane.images[index].image.shot;
    }
    return false;
  }))


  useEffect(() => {
    setActiveMode("all")
    setIndex(0);
    setVariantVideo('enabled');
    setVariantImage('enabled');
    setIsShowingImages(false);
  }, [isVisible, currentLane?.id])

  if (!currentLane || !isVisible) return null;

  let isAdded: boolean = false
  const createdAt = new Date(currentLane?.createdAt);
  const imageText = createdAt.getFullYear() + ' · ' + currentLane.id;

  const handlePrev = () => {
    setIndex((prevIndex: number) => {
      if (!isShowingImages) {
        if (prevIndex === 0) {
          if (currentLane.images && currentLane.images.length > 0 && variantImage !== 'enabled') {
            setIsShowingImages(true);
            return currentLane.images.length - 1;
          }
          return currentLane.videos.length - 1
        }
        return prevIndex - 1;
      } else {
        if (prevIndex === 0) {
          setIsShowingImages(false);
          return currentLane.videos.length - 1;
        }
        return prevIndex - 1;
      }
    });
  };

  const handleNext = () => {
    setIndex((prevIndex: number) => {
      if (!isShowingImages) {
        if (prevIndex < currentLane.videos.length - 1) {
          return prevIndex + 1;
        }
        if (currentLane.images.length > 0 && activeMode !== 'videos') {
          setIsShowingImages(true);
          return 0;
        }
      } else {
        if (prevIndex < currentLane.images.length - 1) {
          return prevIndex + 1;
        }
      }
      return prevIndex;
    });
    toggleIsAnswer(false)
  };


  const toggleVideos = () => {
    if (activeMode === 'videos') {
      setActiveMode('all');
      setVariantVideo('enabled');
      setVariantImage('enabled');
    } else {
      setActiveMode('videos');
      setIndex(0);
      setVariantVideo('active');
      setVariantImage('enabled');
      setIsShowingImages(false);
    }
  };

  const toggleImages = () => {
    if (activeMode === 'images') {
      setActiveMode('all');
      setVariantImage('enabled');
      setVariantVideo('enabled');
      setIsShowingImages(!isShowingImages);
    } else {
      setActiveMode('images');
      setIndex(0);
      setVariantImage('active');
      setVariantVideo('enabled');
      setIsShowingImages(!isShowingImages);
    }
  };

  const handlerCart = () => {
    return !isShowingImages && cart.some(
      (item: CartItem) =>
        item.client === currentLane.id &&
        isVideo(item) && item.video.id === currentLane.videos[index].id
    ) || isShowingImages && cart.some(
      (item: CartItem) =>
        item.client === currentLane.id &&
        isImage(item) && item.image.shot === currentLane.images[index].image.shot
    )
  }

  const toggleIsAnswer = (value: boolean) => {
    setIsAnswer(value);
  };

  return (
    <div ref={modalRef} className="image-modal">
      <div
        className="image-arrow arrow-left cursor-pointer"
        onClick={handlePrev}
        style={
          (activeMode === 'videos' && index === 0) ||
          (activeMode === 'images' && index === 0) ||
          (activeMode === 'all' && (
            (!isShowingImages && index === 0) ||
            (isShowingImages && index === 0 && currentLane.videos.length === 0)
          ))
            ? { opacity: 0, pointerEvents: 'none' }
            : { opacity: 1 }
        }
      >
        <img src={arrow} alt="arrow"/>
      </div>
      <div className="image-modal-window">
        <div className="flex-row justify-between items-center d-flex w-full mb-2 flex">
          <div className="flex-row flex">
            <div className="mr-2">
              <Button text="Videos" onClick={() => toggleVideos()} variant={variantVideo}/>
            </div>
            {currentLane.images && currentLane.images.length > 0 && <div>
              <Button text="Images" onClick={() => {
                toggleImages()
              }} variant={variantImage}/>
            </div>}
          </div>
          <span className="image-modal-header">Tap again to minimize</span>
        </div>
        <div
          className="image-overlay flex-col relative"
          style={
            handlerCart()
              ? { borderColor: 'rgba(167, 255, 137, 0.5)' }
              : {}
          }
          onClick={() => isAdded ? null : onClose()}
        >
          <div style={{ maxHeight: '85%' }}>
            {activeMode !== 'images' && currentLane.videos[index] && !isShowingImages && (
              <video
                ref={videoRef}
                style={{ maxHeight: '100%', width: '100%' }}
                src={`${import.meta.env.VITE_BACKEND_URL}/camera/recording/${currentLane.videos[index].id}/video`}
                muted
                autoPlay
                controls
                loop
              ></video>
            )}
            {activeMode !== 'videos' && currentLane.images[index] && isShowingImages && (
              <img
                src={currentLane.images[index].image.frame}
                alt="pictures"
                width={100}
                height={100}
                style={{ maxHeight: '100%' }}
              />
            )}
          </div>

          <img
            src={logo ?? laneLogo}
            alt="logo"
            className="w-32 h-32 absolute opacity-25"
          />
          <div className="w-full text-right h-0">
            <div className="relative mx-10 bottom-40 flex items-center justify-end">
              {handlerCart() ?
                <Button
                  icon="checkmark"
                  onlyIcon={true}
                  onClick={() => {
                    isAdded = true
                    if (!isShowingImages) onAccept({
                      client: currentLane.id,
                      video: currentLane.videos[index],
                      type: TYPES.VIDEO
                    })
                    if (isShowingImages) onAccept(currentLane.images[index])
                    toggleIsAnswer(!isAnswer)
                  }}
                  color="#34BA05"
                />
                :
                <Button
                  text="Add to cart"
                  onClick={() => {
                    isAdded = true
                    if (!isShowingImages) onAccept({
                      client: currentLane.id,
                      video: currentLane.videos[index],
                      type: TYPES.VIDEO
                    })
                    if (isShowingImages) onAccept(currentLane.images[index])
                    toggleIsAnswer(!isAnswer)
                  }}
                  border={'5px solid rgb(255,215,0)'}
                  color="white"
                  colorText="black"
                  textClass="text-5xl font-extrabold"
                  children={
                    <span
                      className="text-5xl text-yellow-400 mr-5 font-extrabold">
                        {isShowingImages
                          ? `$${Math.round(imagePrice / 100)}`
                          : `$${Math.round((Number(currentLane.videos[index]?.duration) * durationCoef + basePrice) / 100)}`}
                    </span>
                  }/>
              }
            </div>
          </div>
          <div className="image-overlay-info">
            <div className="image-overlay-info-text">
              <span className="image-overlay-info-text-header">
                The shooting segment on line {currentLane.cameraId}
              </span>
              <span className="image-overlay-info-text-subtext">
                {imageText}
              </span>
            </div>
          </div>
        </div>

        {poolEnabled && (!isAnswer && !handlerCart() ? (
          <div className="image-footer">
            {Array.isArray(pools) && pools.slice(0, 1).map((pool: any, index: number) => (
              <div key={index} className="flex items-center justify-between w-full">
                <span className="image-footer-text">
                    {index + 1}. {pool?.text}
                </span>
                <div className="image-footer-buttons">
                  <Button text={pool.answers[0].text} onClick={async () => {
                    toggleIsAnswer(true);
                    await api.kiosk.logging.addPollAnswer({ question: 1, answer: 1, client_id: currentLane.id });
                  }}/>
                  <Button onClick={async () => {
                    isAdded ? null : onClose();
                    await api.kiosk.logging.addPollAnswer({ question: 1, answer: 2, client_id: currentLane.id });
                    toggleIsAnswer(true);
                  }} text={pool.answers[1].text}/>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="image-footer">
            {Array.isArray(pools) && pools.slice(1).map((pool: any, index: number) => {
              let price = isShowingImages ? Math.round(imagePrice / 100) : Math.round(Math.round(Number(Math.round(currentLane.videos[index]?.duration) * durationCoef + basePrice)) / 100)
              const textWithPrice = pool.text.replace('{full_price}', `${price}`);
              return (
                <div key={index} className="flex items-center justify-between w-full">
                  <span className="image-footer-text">
                      {index + 2}. {textWithPrice}
                  </span>
                  <div className="image-footer-buttons">
                    <Button text={pool.answers[0].text} variant={handlerCart() ? 'disabled' : 'enabled'}
                            isButtonEnabled={!handlerCart()}
                            onClick={async () => {
                              if (!isShowingImages) onAccept({
                                client: currentLane.id,
                                video: currentLane.videos[index],
                                type: TYPES.VIDEO
                              });
                              if (isShowingImages) onAccept(currentLane.images[index]);
                              await api.kiosk.logging.addPollAnswer({
                                question: 2,
                                answer: 1,
                                client_id: currentLane.id
                              });
                              handleNext();
                            }}/>
                    <Button onClick={async () => {
                      isAdded ? null : onClose();
                      await api.kiosk.logging.addPollAnswer({ question: 2, answer: 2, client_id: currentLane.id });
                      toggleIsAnswer(false);
                    }} text={pool.answers[0].text}/>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div
        className="image-arrow arrow-right cursor-pointer"
        onClick={handleNext}
        style={
          (activeMode === 'videos' && index < currentLane.videos.length - 1) ||
          (activeMode === 'images' && index < currentLane.images.length - 1) ||
          (activeMode === 'all' && (
            (!isShowingImages && (index < currentLane.videos.length - 1 || currentLane.images.length > 0 && variantImage === 'enabled')) ||
            (isShowingImages && index < currentLane.images.length - 1)
          ))
            ? { opacity: 1, pointerEvents: 'auto' }
            : { opacity: 0, pointerEvents: 'none' }
        }
      >
        <img src={arrow} alt="arrow"/>
      </div>
    </div>
  );
};
