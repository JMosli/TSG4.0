import { CameraTable } from "@component/Table";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import styles from "@page/Cameras/Cameras.module.css";
import { Header } from "@component/Header";
import { useEffect, useState } from "react";
import { PaginationControl } from "@component/Pagination";
import { Socket } from "socket.io-client";
import { Paginated } from "frontend-sdk/dist/types";
import { Link, useNavigate, useParams } from "react-router-dom";
import useLocalApi from "@utils/hooks/useLocalApi";
import { Camera } from "frontend-sdk/dist/camera/types";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import { openRange } from "@store/slice/ws/wsSlice";
import CameraGrid from "./CameraGrid";
import { ButtonLoading } from "@component";

export const CamerasPage = () => {
  const { rangeId } = useParams<{ rangeId: string }>();
  const api = useLocalApi(rangeId!);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [cameras, setCameras] = useState<Paginated<
    ObjectToCamel<Camera>
  > | null>(null);
  const { camera: cameraWs } = useAppSelector((store) => store.ws);
  const [skip, setSkip] = useState(0);

  const loadCameras = async () => {
    const cameras = (await api.camera.list({ take: 20, skip })).ok();
    setCameras(cameras!);
  };

  useEffect(() => {
    loadCameras();
  }, [skip]);

  useEffect(() => {
    if (!rangeId || isNaN(+rangeId)) return;

    dispatch(openRange(+rangeId));

    cameraWs?.onAny((event) => {
      console.log(event);
      if (event === "camera.setup.added" || event === "camera.setup.removed")
        loadCameras();
    });
  }, [cameraWs]);

  if (!cameras) return <>Loading...</>;

  return (
    <div>
      <Header onNavigate={(to) => navigate(`/range/${rangeId}/${to}`)} />
      <Link to="/">(back to range selector)</Link>
      <div className={styles.cameraSection}>
        <div className={`${styles.cameraItems} w-full`}>
          <CameraTable
            cameras={cameras.items}
            controls={
              <>
                <ButtonLoading onTap={() => api.camera.runNetworkProbe()}>
                  Run search
                </ButtonLoading>
              </>
            }
          />
          <PaginationControl
            onPageChange={setSkip}
            take={20}
            startPage={0}
            maxPage={Math.ceil(cameras.count / 20)}
          />
        </div>
        <CameraGrid
          cameras={cameras.items.filter((camera) => camera.connected)}
          rangeId={rangeId!}
        />
      </div>
    </div>
  );
};
