import { CameraPlayer } from "@component";
import { Camera } from "frontend-sdk/dist/camera/types";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";

export default function CameraGrid({
  cameras,
  rangeId,
}: {
  cameras: ObjectToCamel<Camera>[];
  rangeId: string;
}) {
  return (
    <div
      className="flex flex-row flex-wrap gap-3 cursor-pointer"
      onClick={() =>
        window.open(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/range/${rangeId}/api/camera/webrtc/agentdvr/?start=Live`
        )
      }
    >
      {cameras.map((camera) => (
        <CameraPlayer
          rangeId={rangeId}
          streamId={camera.id.toString()}
          className="w-96"
        />
      ))}
    </div>
  );
}
