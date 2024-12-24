import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@component/Header";
import { ButtonLoading } from "@component";
import useLocalApi from "@utils/hooks/useLocalApi";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import { Recording } from "frontend-sdk/dist/camera/recordings/types";

export default function RecordingPage() {
  const { id, rangeId } = useParams<{ id: string; rangeId: string }>();
  const api = useLocalApi(rangeId!);
  const navigate = useNavigate();
  const [recording, setRecording] = useState<ObjectToCamel<Recording> | null>(
    null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    api.camera.recording
      .findRecordingById(+id!)
      .then((res) => res.transpose())
      .then(([response, error]) =>
        response ? setRecording(response) : setError(error.error)
      );
  }, []);

  if (error || !recording) return <>{error}</>;

  return (
    <main>
      <Header onNavigate={(to) => navigate(`/range/${rangeId}/${to}`)} />
      <div className="flex flex-col gap-2 p-2">
        <h3>
          Recording {id} (
          <Link to={`/range/${rangeId}/camera/${recording.cameraId}/recording`}>
            back
          </Link>
          )
        </h3>
        <div className="flex flex-col gap-2 border border-gray-600 m-2 p-2 rounded-md">
          <span>
            Camera:{" "}
            <Link to={`/range/${rangeId}/camera/${recording.cameraId}`}>
              {recording.cameraId}
            </Link>
          </span>
          {recording.isSold && <b>Sold to {recording.clientId}</b>}
          <span>
            Recorded{" "}
            <b>{recording.manuallyRecorded ? "manually" : "automatically"}</b>
          </span>
        </div>
        <div className="flex flex-row gap-3 mt-2">
          <ButtonLoading
            onTap={() => {
              if (confirm("Are you sure you want to remove this recording?"))
                return api.camera.recording
                  .remove(+id!)
                  .then(() =>
                    navigate(
                      `/range/${rangeId}/camera/${recording.cameraId}/recording`
                    )
                  );
              return Promise.resolve();
            }}
          >
            Delete recording
          </ButtonLoading>
        </div>
        <div className="flex flex-col gap-2">
          <video
            src={`${
              import.meta.env.VITE_BACKEND_URL
            }/range/${rangeId}/api/camera/recording/${id}/video`}
            style={{ height: "750px" }}
            controls
          ></video>
          <span>{recording.path}</span>
        </div>
      </div>
    </main>
  );
}
