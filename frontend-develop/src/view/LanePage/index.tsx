import { ImageOverlay } from '@component';
import {
  LaneItemsList,
  LanePageFooter,
  LanePageHeader,
} from '@view/LanePage/components';
import '@view/LanePage/index.css';
import { ClientWithVideo } from 'frontend-sdk/dist/client/types';
import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { ObjectToCamel } from 'ts-case-convert/lib/caseConvert';
import useClients from '@utils/hooks/useClients';
import { setCart } from '@store/slice/cart/cartSlice';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { Image, Video } from '@store/slice/cart/types';
import useLocalApi from '@utils/hooks/useLocalApi';

export const LaneContext = createContext<ObjectToCamel<ClientWithVideo> | null>(null);

const DEFAULT_SCROLL_STATE = {
  isShowMore: true,
  isShowPrevious: false,
};

export const LanePage = () => {
  const laneItemsRef = useRef<HTMLDivElement>(null);
  const api = useLocalApi();

  const [ scrollState, setScrollState ] = useState(DEFAULT_SCROLL_STATE);
  const [ isOverlayVisible, setIsOverlayVisible ] = useState(false);
  const [ currentLaneIndex, setCurrentLaneIndex ] = useState<number>(0);
  const pageRef = useRef(null);
  const { cart } = useAppSelector((state) => state.cart)
  const dispatch = useAppDispatch();

  const [ clients, error, selectClient, loadClients ] = useClients({
    onFaceRecognize: (index) => {
      setIsOverlayVisible((isVisible) => {
        if (isVisible) return isVisible;
        setCurrentLaneIndex(index);
        return true;
      });
    },
  });

  const handleScroll = useCallback(async () => {
    const scrollPosition = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    const isScrolledToBottom = scrollPosition >= pageHeight;

    setScrollState({
      isShowMore: !isScrolledToBottom,
      isShowPrevious: window.scrollY !== 0,
    });

    if (isScrolledToBottom) {
      await loadClients();
    }

  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [ handleScroll ]);

  const findSelectedItems = useCallback(() => {
    return clients?.items.filter((lane) => lane.isSelected);
  }, [ clients ]);

  const handleLaneItem = async (index: number) => {
    setIsOverlayVisible(true);
    setCurrentLaneIndex(index);
    await api.kiosk.logging.visit();
  };

  const handleAcceptLaneItem = (item: Video | Image) => {
    dispatch(setCart(item));
    selectClient(item.client, true);
  };

  const handlerClose = () => {
    setIsOverlayVisible(false);
  };

  const handleFooterButtonClick = async (buttonVariant: 'up' | 'down') => {
    const screenHeight = window.innerHeight;
    const scrollAmount = screenHeight / 2;
    const modifier = buttonVariant === 'down' ? scrollAmount : -scrollAmount;
    window.scrollBy({ top: modifier, behavior: 'smooth' });
  };

  const selectedLanes = findSelectedItems();

  if (!clients || !selectedLanes) return <>Loading...</>;

  return (
    <LaneContext.Provider value={clients.items[currentLaneIndex]}>
      <div>
        <ImageOverlay
          isVisible={isOverlayVisible}
          onAccept={handleAcceptLaneItem}
          onClose={handlerClose}
        />
        <div ref={pageRef} className="lane-wrapper requires-no-scroll">
          <div className="lane-section">
            <LanePageHeader
              selectedLanes={selectedLanes}
              isContinueButtonEnabled={cart.length > 0}
              variant={cart.length > 0 ? 'enabled' : 'disabled'}
            />
            <LaneItemsList
              lanes={clients.items}
              onLaneClick={handleLaneItem}
              ref={laneItemsRef}
              isTV={false}
            />
          </div>

          <LanePageFooter
            visibilityState={{
              isDownButtonEnabled: scrollState.isShowMore,
              isUpButtonEnabled: scrollState.isShowPrevious,
            }}
            onButtonClick={handleFooterButtonClick}
          />
        </div>
      </div>
    </LaneContext.Provider>
  );
};
