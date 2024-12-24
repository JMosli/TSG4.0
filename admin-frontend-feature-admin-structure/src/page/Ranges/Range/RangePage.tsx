import { Header } from "@component/Header";
import useGlobalApi from "@utils/hooks/useGlobalApi";
import { SystemStatus } from "frontend-sdk/dist/types";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import { RangeStatistics } from "@component/RangeStatistics/RangeStatistics";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { openRange } from "@store/slice/ws/wsSlice";
import UsersTable from "@component/Table/UsersTable";
import PatchRangeModal from "@component/Modal/PatchRange";
import { loadRange } from "@store/slice/range/rangeSlice";
import useUserPermissions from "@utils/hooks/useUserPermissions";
import useLocalApi from "@utils/hooks/useLocalApi";

export default function RangePage() {
  const { rangeId } = useParams<{ rangeId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const perms = useUserPermissions();
  const { range } = useAppSelector((state) => state.range);
  const api = useLocalApi(rangeId!);

  const [changing, setChanging] = useState(false);
  const [sysStatus, setSysStatus] =
    useState<ObjectToCamel<SystemStatus> | null>(null);
  const [error, setError] = useState("");

  const enoughPermissions = perms?.includes("owner");
  const drivePercentage = useMemo(
    () =>
      sysStatus ? (sysStatus?.drive.avail / sysStatus?.drive.total) * 100 : 0,
    [sysStatus]
  );
  const ramPercentage = useMemo(
    () =>
      sysStatus
        ? ((sysStatus.totalMem - sysStatus.mem) / sysStatus.totalMem) * 100
        : 0,
    [sysStatus]
  );

  const loadSysStatus = () =>
    api
      .getStatus()
      .then((res) => res.transpose())
      .then(([data, err]) =>
        err ? setError(err.message as string) : setSysStatus(data)
      );

  useEffect(() => {
    if (!rangeId || isNaN(+rangeId)) return setError("No range id found");

    dispatch(loadRange(+rangeId));
    dispatch(openRange(+rangeId));

    const interval = setInterval(loadSysStatus, 30000);
    loadSysStatus();

    return () => {
      clearInterval(interval);
    };
  }, [rangeId]);

  if (error || !range || !rangeId || !sysStatus) return <>{error}</>;
  if (perms && perms[0] === "sg") return navigate(`/range/${rangeId}/camera`);

  return (
    <main>
      <Header onNavigate={(to) => navigate(`/range/${rangeId}/${to}`)} />
      {changing && enoughPermissions && (
        <PatchRangeModal
          range={range}
          toggle={() => setChanging(false)}
          reload={() => dispatch(loadRange(+rangeId))}
        />
      )}
      <h3>
        Range {range?.name} ({range?.id})
      </h3>
      <Link to="/">(back to range selector)</Link>
      {enoughPermissions && (
        <div className="flex flex-col items-center mt-3 w-full">
          <div className="flex flex-col gap-3 w-10/12 border border-neutral-500 p-3 rounded-lg">
            <details>
              <summary>
                <b>Owners: </b>
              </summary>
              <UsersTable
                users={range.owners}
                select={(id) => navigate(`/user/${id}`)}
              />
            </details>
            <details>
              <summary>
                <b>Security guards: </b>
              </summary>
              <UsersTable
                users={range.securityGuards}
                select={(id) => navigate(`/user/${id}`)}
              />
            </details>
            <button onClick={() => setChanging(true)}>
              Change range parameters
            </button>
          </div>
          <RangeStatistics rangeId={+rangeId} />
          <div className="flex flex-row flex-wrap gap-3 border border-neutral-500 p-3 rounded-lg w-fit mt-2">
            <div className="border border-gray-700 p-2 rounded-md flex flex-col gap-2">
              <b>CPU</b>
              <span>{sysStatus.cpus.length} CPUs in total</span>
              <span>
                Uptime: {Math.round(sysStatus.uptime / 60 / 60)} hours
              </span>
              <div
                className="grid gap-2 w-fit"
                style={{
                  gridTemplateColumns: `repeat(${Math.round(
                    Math.sqrt(sysStatus.cpus.length)
                  )}, minmax(0, 1fr))`,
                }}
              >
                {sysStatus.cpus.map((cpu) => (
                  <div
                    className="w-12 h-12"
                    style={{
                      background: `rgb(${Math.round(255 * cpu.usage)},${
                        255 - Math.round(255 * cpu.usage)
                      }, 0)`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 border border-gray-700 p-2 rounded-md">
              <b>Drive</b>
              <span>
                {Math.round(sysStatus.drive.avail / 1024 ** 3)} GiB /{" "}
                {Math.round(sysStatus.drive.total / 1024 ** 3)} GiB used
              </span>
              <div
                className="w-full h-8"
                style={{
                  background: `linear-gradient(90deg, #000fda ${drivePercentage}%, #000fda ${drivePercentage}%, #1b1b1b ${drivePercentage}%, #1b1b1b 100%)`,
                }}
              ></div>
            </div>
            <div className="flex flex-col gap-2 border border-gray-700 p-2 rounded-md">
              <b>RAM</b>
              <span>
                {Math.round((sysStatus.totalMem - sysStatus.mem) / 1024 ** 3)}{" "}
                GiB / {Math.round(sysStatus.totalMem / 1024 ** 3)} GiB used
              </span>
              <div
                className="w-full h-8"
                style={{
                  background: `linear-gradient(90deg, #007896 ${ramPercentage}%, #007896 ${ramPercentage}%, #1b1b1b ${ramPercentage}%, #1b1b1b 100%)`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
