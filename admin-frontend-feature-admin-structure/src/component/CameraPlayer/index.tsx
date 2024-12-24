import "@component/CameraPlayer/CameraPlayer.css";
import React, { useEffect, useRef } from "react";

type CameraPlayerProps = {
  streamId: string;
  rangeId: string;
  videoOptions?: React.HTMLAttributes<HTMLVideoElement>;
};

export const CameraPlayer = ({
  streamId,
  rangeId,
  videoOptions = {},
  ...other
}: CameraPlayerProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div {...other}>
      <img
        src={`${
          import.meta.env.VITE_BACKEND_URL
        }/range/${rangeId}/api/camera/${streamId}/webrtc/agentdvr/stream.mjpg`}
      ></img>
    </div>
  );
};
