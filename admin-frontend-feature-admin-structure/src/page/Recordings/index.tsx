import {
  GetAllRecordingsDto,
  Recording,
} from "frontend-sdk/dist/camera/recordings/types";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ButtonLoading } from "@component";
import { PaginationControl } from "@component/Pagination";
import { Header } from "@component/Header";
import useLocalApi from "@utils/hooks/useLocalApi";
import { Paginated } from "frontend-sdk/dist/types";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";

export default function RecordingsPage() {
  const { camId, rangeId } = useParams<{ camId: string; rangeId: string }>();
  const api = useLocalApi(rangeId!);
  const navigate = useNavigate();

  const [recordings, setRecordings] = useState<Paginated<
    ObjectToCamel<Recording>
  > | null>(null);
  const [parameters, setParameters] = useState<
    Omit<GetAllRecordingsDto, "skip" | "take">
  >({});
  const [useFilter, setUseFilter] = useState(false);
  const [skip, setSkip] = useState(0);

  // @ts-ignore
  const [error, setError] = useState<string | null>(null);

  const loadRecordings = async (
    parameters: Partial<GetAllRecordingsDto> = {}
  ) => {
    const recordings = (
      await api.camera.recording.findAllRecordings({
        take: 20,
        skip,
        ...parameters,
      })
    ).ok();
    setRecordings(recordings!);
  };

  useEffect(() => {
    if (useFilter) loadRecordings(parameters);
  }, [parameters]);

  useEffect(() => {
    loadRecordings();
  }, [useFilter, skip]);

  if (error || !recordings) return <>{error}</>;

  return (
    <main className="w-full">
      <Header onNavigate={(to) => navigate(`/range/${rangeId}/${to}`)} />
      <div className="w-full flex flex-col gap-2 p-2">
        <h3>Recordings</h3>
        <span>
          Camera: <Link to={`/range/${rangeId}/camera/${camId}`}>{camId}</Link>
        </span>
        <div className="flex flex-row gap-3 p-2 border border-gray-800 m-2 rounded-md">
          <label className="cursor-pointer">
            <b>Use filter:</b>{" "}
            <input
              type="checkbox"
              checked={useFilter}
              onChange={(event) => setUseFilter(event.currentTarget.checked)}
            />
          </label>

          <label className="cursor-pointer">
            Only manually recorded:{" "}
            <input
              type="checkbox"
              onChange={(event) =>
                setParameters({
                  ...parameters,
                  manually_recorded: event.currentTarget.checked,
                })
              }
            />
          </label>
          <label className="cursor-pointer">
            Only sold:{" "}
            <input
              type="checkbox"
              onChange={(event) =>
                setParameters({
                  ...parameters,
                  is_sold: event.currentTarget.checked,
                })
              }
            />
          </label>
        </div>
        <table className="w-full h-fit">
          <thead>
            <tr>
              <th>id</th>
              <th>Is sold</th>
              <th>Manually recorded</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {recordings.items.map((rec) => (
              <tr
                className="hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={(event) =>
                  !(event.target as HTMLButtonElement).matches("button")
                    ? navigate(`/range/${rangeId}/camera/recording/${rec.id}`)
                    : null
                }
                key={rec.id}
              >
                <td>{rec.id}</td>
                <td>{String(rec.isSold)}</td>
                <td>{String(rec.manuallyRecorded)}</td>
                <td>
                  <ButtonLoading
                    onTap={() => {
                      if (
                        confirm(
                          "Are you sure you want to remove this recording?"
                        )
                      )
                        return api.camera.recording
                          .remove(rec.id)
                          .then(() => loadRecordings());
                      return Promise.resolve();
                    }}
                  >
                    Remove
                  </ButtonLoading>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationControl
          onPageChange={setSkip}
          maxPage={Math.ceil(recordings.count / 20)}
          startPage={0}
          take={20}
        />
      </div>
    </main>
  );
}
