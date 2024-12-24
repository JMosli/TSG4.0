import "@component/Table/CameraTable/CameraTable.css";
import { ReactNode, useState } from "react";
import { ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { CreateCameraModal } from "@component/Modal";
import { Camera } from "frontend-sdk/dist/camera/types";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import useUserPermissions from "@utils/hooks/useUserPermissions";

const columns = [
  "ID",
  "IP",
  "Port",
  "Username",
  "Password",
  "Streaming",
  "Connected",
  "LaneName",
  "AtKiosk",
];

type Props = {
  cameras: ObjectToCamel<Camera>[];
  controls?: ReactNode;
};

export const CameraTable = ({ cameras, controls }: Props) => {
  const { rangeId } = useParams<{ rangeId: string }>();
  const [modalActive, setModalActive] = useState(false);
  const navigate = useNavigate();
  const perms = useUserPermissions();
  const enoughPerms = perms?.includes("owner");

  const handleModalActive = () => {
    setModalActive(!modalActive);
  };

  return (
    <div className="w-full">
      {modalActive ? (
        <CreateCameraModal toggle={handleModalActive} />
      ) : undefined}
      <div className="table-title my-4 flex flex-col gap-3">
        <h2>Cameras</h2>
        <button onClick={handleModalActive}>Add new camera</button>
        {controls}
      </div>
      <table className="w-full text-wrap h-fit">
        <thead>
          <tr>
            <th>ID</th>
            {enoughPerms && (
              <>
                <th>IP</th>
                <th>Port</th>
                <th>Username</th>
                <th>Password</th>
                <th>LaneName</th>
                <th>AtKiosk</th>
              </>
            )}
            <th>Streaming</th>
            <th>Connected</th>
          </tr>
        </thead>
        <tbody>
          {cameras.map((camera) => {
            return (
              <tr
                key={camera.id}
                className="hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() =>
                  navigate(`/range/${rangeId}/camera/${camera.id}`)
                }
              >
                <td>{camera.id}</td>
                {enoughPerms && (
                  <>
                    <td>{camera.ipAddress}</td>
                    <td>{camera.port}</td>
                    <td>{camera.username}</td>
                    <td>{camera.password}</td>
                    <td>{camera.laneName ?? "-"}</td>
                    <td>{String(camera.isAtKiosk)}</td>
                  </>
                )}
                <td>{String(camera.streaming)}</td>
                <td>{String(camera.connected)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ToastContainer />
    </div>
  );
};
