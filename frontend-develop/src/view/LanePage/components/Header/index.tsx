import { Link } from "react-router-dom";
import qrCode from "@assets/qr-code.png";
import "@view/LanePage/components/Header/index.css";
import { Button } from "@component";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import { ClientWithVideo } from "frontend-sdk/dist/client/types";

interface LanePageHeaderProps {
  selectedLanes: ObjectToCamel<ClientWithVideo>[];
  isContinueButtonEnabled: boolean;
  variant: 'enabled' | 'disabled'
}

export const LanePageHeader = ({
  selectedLanes,
  isContinueButtonEnabled,
                                 variant
}: LanePageHeaderProps) => {
;
  return (
    <div className="lane-header">
      <div className="lane-header-title">
        <span className="lane-header-title-text">
          Fire Moments: Shooting Video Gallery
        </span>
        <span className="lane-header-subtitle-text">
          Capture your best moments with our videos and photos.
        </span>
      </div>
      <div className='flex items-center'>
      <Link to="/buy" state={{ selectedLanes }} className='mr-10'>
        <Button
          text={"Checkout"}
          icon="arrow"
          gap={37}
          variant={variant}
          isButtonEnabled={isContinueButtonEnabled}
          iconPosition="right"
          rotateIconDeg={-90}
        />
      </Link>
      </div>
    </div>
  );
};
