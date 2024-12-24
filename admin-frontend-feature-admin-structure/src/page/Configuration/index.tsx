import "@page/Configuration/Configuration.css";
import { ConfigurationTable } from "@component/Table";
import { Header } from "@component/Header";
import useLocalApi from "@utils/hooks/useLocalApi";
import { useNavigate, useParams } from "react-router-dom";
import { Configuration } from "../../component/Table/ConfigurationTable/types";
import { useEffect, useState } from "react";
import ChangeLogoModal from "@component/Modal/ChangeLogoModal";
import useUserPermissions from "@utils/hooks/useUserPermissions";
import { confDescriptions } from "@component/Modal/CreateConfigurationModal/descriptions";

export const ConfigurationPage = () => {
  const { rangeId } = useParams<{ rangeId: string }>();
  const api = useLocalApi(rangeId!);
  const navigate = useNavigate();
  const perms = useUserPermissions();

  const [logoModalActive, setLogoModalActive] = useState(false);
  const [configuration, setConfiguration] = useState<Configuration[]>([]);

  const loadConfiguration = async () => {
    const config = (await api.configuration.getFullConfiguration()).ok();
    setConfiguration(config!);
  };

  useEffect(() => {
    if (isNaN(+rangeId!)) return;

    loadConfiguration();
  }, []);

  if (!rangeId || isNaN(+rangeId)) return <>Wrong range id.</>;

  return (
    <main className="w-full">
      {logoModalActive && (
        <ChangeLogoModal
          rangeId={rangeId}
          toggle={() => setLogoModalActive(false)}
          reload={loadConfiguration}
        />
      )}
      <Header onNavigate={(to) => navigate(`/range/${rangeId}/${to}`)} />
      <div className="section w-full flex flex-col gap-2">
        <img
          src={
            configuration.filter((entry) => entry.key === "ui.kiosk.logo").at(0)
              ?.value
          }
          className="w-36"
        />
        <button className="w-full" onClick={() => setLogoModalActive(true)}>
          Change logo
        </button>
        <ConfigurationTable
          rangeId={rangeId}
          configurations={configuration.filter(
            (c) =>
              (perms?.includes("owner") &&
                !perms.includes("all") &&
                confDescriptions[c.key].accessible) ||
              perms?.includes("all")
          )}
          reload={loadConfiguration}
        />
      </div>
    </main>
  );
};
