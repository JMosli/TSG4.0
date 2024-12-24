import laneLogo from "@assets/lane-logo.png";
import yourLogo from "@assets/your-logo.png";
import "@view/LanePage/components/Footer/index.css";
import { Button } from "@component";
import { useAppSelector } from "@store/hooks";
import { getConfValue } from "@store/slice/config/configSlice";

interface ButtonsVisibilityState {
  isUpButtonEnabled: boolean;
  isDownButtonEnabled: boolean;
}

interface LanePageFooterProps {
  visibilityState: ButtonsVisibilityState;
  onButtonClick: (buttonVariant: "up" | "down") => void;
}

export const LanePageFooter = ({
  visibilityState,
  onButtonClick,
}: LanePageFooterProps) => {
  const { config } = useAppSelector((state) => state.config);

  return (
    <div className="footer-section">
      <div className="footer-show-more">
        <div className="footer-show-more-buttons">
          <Button
            variant={visibilityState.isUpButtonEnabled ? "enabled" : "disabled"}
            isButtonEnabled={visibilityState.isUpButtonEnabled}
            text={"Show previous"}
            gap={20}
            icon="arrow"
            iconPosition="left"
            rotateIconDeg={180}
            onClick={() => onButtonClick("up")}
          />
          <Button
            variant={
              visibilityState.isDownButtonEnabled ? "enabled" : "disabled"
            }
            isButtonEnabled={visibilityState.isDownButtonEnabled}
            text={"Show more"}
            gap={20}
            icon="arrow"
            iconPosition="left"
            onClick={() => onButtonClick("down")}
          />
        </div>
      </div>
      <div className="footer">
        <div className="footer-info">
          <img src={laneLogo} alt="lane-logo" />
          <span>
            tap the media you wish to review and then add to card and press Checkout
          </span>
          <img
            src={getConfValue<string>(config, "ui.kiosk.logo") ?? ""}
            alt=""
            className="w-32 h-32"
          />
        </div>
      </div>
    </div>
  );
};
