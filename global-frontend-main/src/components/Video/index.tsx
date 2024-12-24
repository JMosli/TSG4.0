import { useEffect, useRef, useState } from "react";
import OpenedVideo from "./OpenedModal";

export default function Video({ src }: { src: string }) {
  const [opened, setOpened] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    videoRef.current.muted = true;
    videoRef.current.defaultMuted = true;
    videoRef.current.playsInline = true;
    videoRef.current.src = src;
  }, [src]);

  return (
    <>
      {opened && <OpenedVideo src={src} toggle={() => setOpened(!opened)} />}
      <div className="rounded-lg overflow-hidden border-neutral-600 border shadow-md">
        <video
          ref={videoRef}
          src={src}
          className="w-64"
          onClick={() => setOpened(!opened)}
          autoPlay
          loop
          muted
          playsInline
        ></video>
      </div>
    </>
  );
}
