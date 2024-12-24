import emailVector from "@assets/email-vector.svg";
import { Button, MomentList } from "@component";
import { useAppDispatch } from "@store/hooks";
import useClients from "@utils/hooks/useClients";
import "@view/MomentsYouLike/index.css";
import { useCallback } from "react";

export const MomentsYouLike = () => {
  const [clients] = useClients({ onFaceRecognize: () => null });

  const findSelectedItems = useCallback(() => {
    return clients?.items.filter((client) => client.isSelected);
  }, [clients]);

  const selectedLanes = findSelectedItems();

  if (!selectedLanes || !clients) return <>Loading</>;

  return (
    <div className="moments-you-like requires-no-scroll">
      <div className="moments-you-like-gradient" />
      <div className="moments-you-like-bg"></div>
      <div className="moments-you-like-header">
        <div className="moments-you-like-header-title">
          <span className="moments-you-like-header-title-text">
            Select moments you like
          </span>
          <span className="moments-you-like-header-title-subtitle">
            Tap to watch on full screen
          </span>
        </div>
        <div className="moments-you-like-header-purchases">
          <span className="moments-you-like-header-purchases-text">
            Purchases
          </span>
          <div className="moments-you-like-header-purchases-symbol">
            <img src={emailVector} alt={emailVector} />
            <div className="moments-you-like-header-purchases-symbol-circle">
              <span className="moments-you-like-header-purchases-symbol-circle-text">
                {selectedLanes.length}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="moments-you-like-content">
        <div className="moments-you-like-content-list">
          <div className="list-items">
            <div className="list-items-overflow">
              <MomentList clients={clients.items} />
            </div>
          </div>
        </div>
        <div className="moments-you-like-content-buttons">
          <div className="moments-you-like-content-buttons-back">
            <Button
              text={"Back to all video"}
              icon="arrow"
              rotateIconDeg={90}
              gap={20}
              iconPosition="left"
              color="transparent"
            />
          </div>
          <div className="moments-you-like-content-buttons-last">
            <Button text={"Cancel"} color="transparent" />
            <Button
              text={"Checkout"}
              icon="at"
              gap={74}
              iconPosition="right"
              color="transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
