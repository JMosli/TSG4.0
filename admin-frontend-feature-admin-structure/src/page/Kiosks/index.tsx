import { useEffect, useState } from "react";
import "@page/Kiosks/KiosksPage.css";
import { useNavigate, useParams } from "react-router-dom";
import { ButtonLoading } from "@component/ButtonLoading";
import { Header } from "@component/Header";
import useLocalApi from "@utils/hooks/useLocalApi";
import { Paginated } from "frontend-sdk/dist/types";
import { PaginationControl } from "@component/Pagination";
import { Kiosk } from "frontend-sdk/dist/kiosk/types";
import { ObjectToCamel } from "ts-case-convert";

const columns = ["ID", "IsConnected", "Camera Attached", "Delete"];

export const KiosksPage = () => {
  const { rangeId } = useParams<{ rangeId: string }>();
  const api = useLocalApi(rangeId!);
  const navigate = useNavigate();

  const [kiosks, setKiosks] = useState<Paginated<ObjectToCamel<Kiosk>> | null>(
    null
  );
  const [skip, setSkip] = useState(0);

  const loadKiosks = async () => {
    const kiosks = (await api.kiosk.list({ take: 20, skip })).ok();
    setKiosks(kiosks!);
  };

  useEffect(() => {
    if (!rangeId || isNaN(+rangeId)) return;

    loadKiosks();
  }, []);

  if (!kiosks) return <>Loading...</>;

  return (
    <div>
      <Header onNavigate={(to) => navigate(`/range/${rangeId}/${to}`)} />
      <div className="kiosk-section">
        <ButtonLoading onTap={() => api.kiosk.create().then(loadKiosks)}>
          Create new kiosk
        </ButtonLoading>
        <table className="h-fit w-full mt-3">
          <thead>
            <tr>
              {columns.map((column) => {
                return <th key={column}>{column}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {kiosks.items.map((kiosk: ObjectToCamel<Kiosk>) => {
              return (
                <tr
                  key={kiosk.id}
                  className="hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={(event) =>
                    !(event.target as HTMLButtonElement).matches("button")
                      ? navigate(`/range/${rangeId}/kiosk/${kiosk.id}`)
                      : null
                  }
                >
                  <td>{kiosk.id}</td>
                  <td>{String(kiosk.isConnected)}</td>
                  <td>{kiosk.camera ? kiosk.camera.id : "false"}</td>
                  <td>
                    <ButtonLoading
                      onTap={() => {
                        if (
                          confirm("Are you sure you want to remove this kiosk?")
                        )
                          return api.kiosk
                            .remove(kiosk.id)
                            .then(() => loadKiosks);
                        return Promise.resolve();
                      }}
                    >
                      Delete
                    </ButtonLoading>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <PaginationControl
          onPageChange={setSkip}
          maxPage={Math.ceil(kiosks.count / 20)}
          startPage={0}
          take={20}
        />
      </div>
    </div>
  );
};
