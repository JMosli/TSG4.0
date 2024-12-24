import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { KioskAnalytics } from "./types";
import { Header } from "@component/Header";
import { ButtonLoading, Graph } from "@component";
import useLocalApi from "@utils/hooks/useLocalApi";
import useUserPermissions from "@utils/hooks/useUserPermissions";
import { useAppDispatch } from "@store/hooks";
import { loadRange } from "@store/slice/range/rangeSlice";
import useRange from "@utils/hooks/useRange";
import { Kiosk } from "frontend-sdk/dist/kiosk/types";
import { ObjectToCamel } from "ts-case-convert";
import CreateTerminalModal from "@component/Modal/CreateTerminalModal";

export default function KioskPage() {
  const { id, rangeId } = useParams<{ id: string; rangeId: string }>();
  const range = useRange(+rangeId!);
  const api = useLocalApi(rangeId!);
  const navigate = useNavigate();
  const perms = useUserPermissions();

  const [kiosk, setKiosk] = useState<ObjectToCamel<Kiosk> | null>(null);
  const [analytics, setAnalytics] = useState<KioskAnalytics | null>(null);
  const [creatingTerminal, setCreatingTerminal] = useState(false);
  const [error, setError] = useState("");

  const enoughPermissions = perms?.includes("owner");
  console.log(perms);

  const graphData = useMemo(
    () =>
      analytics?.priceByDay.map((price) => ({
        date: new Date(price.date).toLocaleDateString("en-GB"),
        value: price.count,
      })),
    [analytics]
  );

  const load = () => {
    if (!id || isNaN(+id)) return setError("Id not found");
    if (!rangeId || isNaN(+rangeId)) return setError("Range id not found");

    api.kiosk
      .retrieve(+id)
      .then((res) => res.transpose())
      .then(([response, error]) =>
        response ? setKiosk(response) : setError(error.error)
      );

    enoughPermissions &&
      api.kiosk
        .analytics(+id)
        .then((res) => res.transpose())
        .then(([response, error]) =>
          response ? setAnalytics(response) : setError(error.error)
        );
  };

  useEffect(load, []);

  if (error || !kiosk) return <>{error}</>;

  return (
    <main>
      <Header onNavigate={(to) => navigate(`/range/${rangeId}/${to}`)} />
      {creatingTerminal && enoughPermissions && (
        <CreateTerminalModal
          rangeId={rangeId!}
          kioskId={kiosk.id}
          toggle={() => setCreatingTerminal(false)}
          reload={load}
        />
      )}
      <div className="w-full flex flex-col gap-2 p-2">
        <h3>Kiosk {kiosk.id}</h3>
        <div className="flex flex-col gap-2 mt-2">
          {kiosk.camera && (
            <span>
              Connected camera{" "}
              <Link to={`/range/${rangeId}/camera/${kiosk.camera.id}`}>
                {kiosk.camera.id}
              </Link>
            </span>
          )}
          {enoughPermissions && (
            <>
              {kiosk.terminal ? (
                <span>
                  Connected terminal: {kiosk.terminal.readerId}{" "}
                  <ButtonLoading
                    onTap={() =>
                      api.terminal.remove(kiosk.terminal?.id!).then(load)
                    }
                    className="ml-2 text-red-600"
                  >
                    Disconnect
                  </ButtonLoading>
                </span>
              ) : (
                <button onClick={() => setCreatingTerminal(true)}>
                  Connect terminal
                </button>
              )}
            </>
          )}
          <span>
            Access key: <i>{kiosk.accessKey}</i>
          </span>
          <span>Is connected: {String(kiosk.isConnected)}</span>
        </div>
        {enoughPermissions && (
          <div className="flex flex-col gap-3 border border-gray-700 rounded-lg p-4">
            {analytics?.clients && (
              <b className="text-green-400 text-lg ">
                Total clients: {analytics.clients}
              </b>
            )}
            <div className="w-full h-[1px] bg-neutral-700"></div>
            {graphData && (
              <div className="flex items-center flex-col w-full">
                <b>Number of clients per date</b>
                <Graph
                  data={graphData}
                  charts={[
                    { valueName: "Number of clients", dataKey: "value" },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
