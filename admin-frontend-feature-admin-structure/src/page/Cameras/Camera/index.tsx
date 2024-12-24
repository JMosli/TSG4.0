import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { wait } from "@utils/utils";
import { Header } from "@component/Header";
import { ButtonLoading, CameraPlayer } from "@component";
import useLocalApi from "@utils/hooks/useLocalApi";
import { Camera } from "frontend-sdk/dist/camera/types";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import useUserPermissions from "@utils/hooks/useUserPermissions";

export function CameraPage() {
  const { id, rangeId } = useParams<{ id: string; rangeId: string }>();
  const api = useLocalApi(rangeId!);
  const navigate = useNavigate();
  const perms = useUserPermissions();
  const attachFormRef = useRef<HTMLFormElement | null>(null);
  const streamUriFormRef = useRef<HTMLFormElement | null>(null);

  const [camera, setCamera] = useState<ObjectToCamel<Camera> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCamera = () => {
    // I do want to see types, so I dont fuck with the redux
    return api.camera
      .retrieve(+id!)
      .then((res) => res.transpose())
      .then(([response, error]) =>
        response ? setCamera(response) : setError(error.error)
      );
  };

  useEffect(() => {
    if (!id || isNaN(+id)) return setError("Id not found");

    loadCamera();

    api.camera.recording
      .getStatus(+id)
      .then((res) => res.transpose())
      .then(([response, error]) =>
        response ? setIsRecording(response.isActive) : setError(error.error)
      );
  }, []);

  const handleRecording = async () => {
    if (!id || isNaN(+id)) return;

    if (!isRecording) (await api.camera.recording.record(+id)).ok();
    if (isRecording) (await api.camera.recording.stopRecording(+id)).ok();

    // Yes, we can do some sort of optimistic update, but just in case it didnt
    // actually run, we want to do this
    const status = (await api.camera.recording.getStatus(+id)).ok();
    setIsRecording(status!.isActive);
  };

  const handleLaneAttach = async () => {
    if (!camera) return;

    const formData = new FormData(attachFormRef.current!);
    const laneName = formData.get("lane_name");
    if (!laneName) return;

    await api.lane.attachCameraToLane(camera.id, laneName as string);
    await loadCamera();
  };

  const handleKioskAttach = async () => {
    if (!camera) return;

    const formData = new FormData(attachFormRef.current!);
    const kioskId = formData.get("kiosk_id");
    if (!kioskId || isNaN(+kioskId)) return;

    await api.kiosk.attachCamera(+kioskId, camera.id);
    await loadCamera();
  };

  const handleChangeStreamUri = async () => {
    if (!camera) return;

    const formData = new FormData(streamUriFormRef.current!);
    const uri = formData.get("stream_uri") as string;
    if (!uri || uri === camera.streamUrl) return;

    await api.camera.changeStreamUrl(camera.id, uri);
    await loadCamera();
  };

  const handlePlayerClick = async () => {
    if (!camera) return;

    const obj = (await api.camera.webrtc.getObject(camera.id)).ok();
    const video = obj?.filter((o) => "name" in o && o.typeID === 2)[0];
    if (!video || !("name" in video)) return;

    window.open(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/range/${rangeId}/api/camera/webrtc/agentdvr/?start=Live&ot=${
        video.id
      }&oid=2&max=true&viewIndex=0`
    );
  };

  const handleDebugSettings = async (event: React.MouseEvent) => {
    if (!camera) return;

    const formData = new FormData(
      (event.target as HTMLElement).parentNode as HTMLFormElement
    );
    const skipNFrames = +(formData.get("skipNFrames") as string);
    const scale = +(formData.get("scale") as string);
    const targetWidth = +(formData.get("targetWidth") as string);
    const rotation = +(formData.get("rotation") as string);

    if (
      isNaN(skipNFrames) ||
      isNaN(scale) ||
      isNaN(targetWidth) ||
      isNaN(rotation)
    )
      return;
    if (skipNFrames < 1 || scale < 1 || targetWidth < 120) return;

    await api.camera.updateCameraConfig(camera.id, {
      skipNFrames,
      scale,
      targetWidth,
      rotation,
    });
    await loadCamera();
  };

  if (error || !camera) return <>{error}</>;

  return (
    <main className="p-2">
      <Header onNavigate={(to) => navigate(`/range/${rangeId}/${to}`)} />
      <h3>
        Camera {id} {!camera.connected ? "(not connected)" : null}
      </h3>
      <div
        className={`w-full flex flex-row justify-evenly mt-6 gap-2 flex-wrap ${
          !camera.connected ? "brightness-50 grayscale pointer-events-none" : ""
        }`}
      >
        <div className="flex flex-col gap-2" style={{ maxWidth: "700px" }}>
          <b>Live stream</b>
          {rangeId && (
            <CameraPlayer
              rangeId={rangeId}
              streamId={camera.id.toString()}
              onClick={handlePlayerClick}
              className="cursor-pointer"
            />
          )}
          {perms?.includes("all") && (
            <span className="opacity-5 hover:opacity-100 transition-all">
              {camera.streamUrl}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 border border-gray-800 p-3 rounded-lg flex-1 max-w-96">
          <div className="flex flex-col gap-4 border border-gray-600 p-2 rounded-md">
            <i>
              Currently attached to{" "}
              {camera.isAtKiosk ? (
                <Link to={`/range/${rangeId}/kiosk/${camera.kioskId}`}>
                  kiosk {camera.kioskId}
                </Link>
              ) : null}
              {camera.laneName ? (
                <>
                  lane <b>{camera.laneName}</b>
                </>
              ) : null}
              {!camera.laneName && !camera.isAtKiosk ? "nothing" : null}
            </i>
            {camera.isAtKiosk && camera.kioskId && (
              <ButtonLoading
                onTap={() =>
                  api.kiosk
                    .detachCamera(camera.kioskId, camera.id)
                    .then(() => wait(1000)) // block user actions
                    .then(loadCamera)
                }
              >
                Detach from kiosk
              </ButtonLoading>
            )}
            {camera.laneName && (
              <ButtonLoading
                onTap={() =>
                  api.lane
                    .detachCameraFromLane(camera.id, camera.laneName ?? "")
                    .then(() => wait(1000)) // block user actions
                    .then(loadCamera)
                }
              >
                Detach from lane
              </ButtonLoading>
            )}
            {!camera.laneName && !camera.isAtKiosk && (
              <form
                className="w-full flex flex-col gap-3"
                onSubmit={(event) => event.preventDefault()}
                ref={attachFormRef}
              >
                <details className="p-2 w-full border border-gray-800 rounded-md">
                  <summary>Attach to lane</summary>
                  <div className="flex flex-col gap-2 m-1">
                    <input
                      placeholder="Lane name"
                      className="p-2 border-gray-600 border rounded-md outline-none"
                      name="lane_name"
                    />
                    <ButtonLoading onTap={handleLaneAttach}>
                      Attach to lane
                    </ButtonLoading>
                  </div>
                </details>
                <details className="p-2 w-full border border-gray-800 rounded-md">
                  <summary>Attach to kiosk</summary>
                  <div className="flex flex-col gap-2 m-1">
                    <input
                      placeholder="Kiosk id"
                      className="p-2 border-gray-600 border rounded-md outline-none"
                      name="kiosk_id"
                      type="number"
                    />
                    <ButtonLoading onTap={handleKioskAttach}>
                      Attach to kiosk
                    </ButtonLoading>
                  </div>
                </details>
              </form>
            )}
          </div>
          <div className="flex flex-col gap-1 border border-gray-600 p-2 rounded-md">
            <b>Actions</b>
            <ButtonLoading onTap={() => api.camera.restartStream(camera.id)}>
              Restart stream
            </ButtonLoading>
            <ButtonLoading
              onTap={() => api.camera.disable(camera.id).then(loadCamera)}
            >
              Stop processing
            </ButtonLoading>
          </div>
          <div className="flex flex-col gap-1 border border-gray-600 p-2 rounded-md">
            <b>Recording</b>
            <Link to={`/range/${rangeId}/camera/${id}/recording`}>
              See recordings
            </Link>
            <ButtonLoading
              className={`${isRecording ? "text-red-500" : ""}`}
              onTap={handleRecording}
            >
              {isRecording ? "Stop" : "Start"} recording
            </ButtonLoading>
          </div>
          {perms?.includes("owner") && (
            <div className="flex flex-col gap-2 border border-gray-600 p-2 rounded-md">
              <b>Streaming</b>
              <details className="p-2 w-full border border-gray-800 rounded-md">
                <summary>Change stream URI</summary>
                <form
                  className="flex flex-col gap-2 m-1"
                  onSubmit={(e) => e.preventDefault()}
                  ref={streamUriFormRef}
                >
                  <input
                    placeholder="New stream URI"
                    className="p-2 border-gray-600 border rounded-md outline-none"
                    name="stream_uri"
                    defaultValue="rtsp://"
                  />
                  <ButtonLoading onTap={handleChangeStreamUri}>
                    Apply (stops stream)
                  </ButtonLoading>
                </form>
              </details>
              <details className="p-2 w-full border border-gray-800 rounded-md">
                <summary>Debug settings</summary>
                <form
                  className="flex flex-col gap-2 m-1"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <label>Frames to skip</label>
                  <input
                    defaultValue={camera.config.skipNFrames?.toString() ?? ""}
                    className="p-2 border-gray-600 border rounded-md outline-none"
                    name="skipNFrames"
                  />

                  <label>Scale</label>
                  <input
                    defaultValue={camera.config.scale?.toString() ?? ""}
                    className="p-2 border-gray-600 border rounded-md outline-none"
                    name="scale"
                  />

                  <label>Target resize width</label>
                  <input
                    defaultValue={camera.config.targetWidth?.toString() ?? ""}
                    className="p-2 border-gray-600 border rounded-md outline-none"
                    name="targetWidth"
                  />

                  <label>Rotation</label>
                  <input
                    defaultValue={camera.config.rotation?.toString() ?? ""}
                    className="p-2 border-gray-600 border rounded-md outline-none"
                    name="rotation"
                  />

                  <textarea
                    defaultValue={JSON.stringify(camera.config)}
                    className="p-2 border-gray-600 border rounded-md outline-none"
                    name="config"
                  ></textarea>

                  <ButtonLoading onTap={handleDebugSettings}>
                    Apply
                  </ButtonLoading>
                </form>
              </details>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
