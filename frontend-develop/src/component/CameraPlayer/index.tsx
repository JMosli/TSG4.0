import "@component/CameraPlayer/CameraPlayer.css";
import React, { useEffect, useRef } from "react";

type CameraPlayerProps = {
  streamId: string;
  videoOptions?: React.HTMLAttributes<HTMLVideoElement>;
};

export const CameraPlayer = ({
  streamId,
  videoOptions = {},
  ...other
}: CameraPlayerProps & React.HTMLAttributes<HTMLDivElement>) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const video = document.createElement("video-rtc") as HTMLVideoElement;
    const src = new URL(import.meta.env.VITE_RTC_WS_URL);
    video.src = src.toString();

    Object.assign(video, videoOptions);

    anchorRef.current!.appendChild(video);

    return () => video.remove();
  }, []);

  return <div ref={anchorRef} {...other}></div>;
};
