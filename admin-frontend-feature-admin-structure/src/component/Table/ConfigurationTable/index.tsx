import { toast, ToastContainer } from "react-toastify";
import "@component/Table/ConfigurationTable/ConfigurationTable.css";
import { useState } from "react";
import { CreateConfigurationModal } from "@component/Modal";
import { Configuration } from "./types";
import {
  ConfDescription,
  confDescriptions,
} from "@component/Modal/CreateConfigurationModal/descriptions";

type Props = {
  configurations: Configuration[];
  rangeId: string;
  reload: () => void;
};
type GroupedConfigurations = {
  [mainSpec: string]: {
    [key: string]: Configuration;
  };
};

const columns = ["ID", "Must reboot", "Key", "Value"];

export const ConfigurationTable = ({
  configurations,
  rangeId,
  reload,
}: Props) => {
  const [changeModalActive, setModalActive] = useState(false);
  const [configuration, setConfiguration] = useState<Configuration | null>(
    configurations[0]
  );
  const groupedConfigurations = Object.values(configurations).reduce(
    (acc, conf) => {
      const mainSpec = conf.key.split(".")[0]; // Extract the main specification
      if (!acc[mainSpec]) {
        acc[mainSpec] = {};
      }
      acc[mainSpec][conf.key] = conf;
      return acc;
    },
    {} as GroupedConfigurations
  );

  const handleModalActive = () => {
    setModalActive(!changeModalActive);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {changeModalActive && (
        <CreateConfigurationModal
          currentConf={configuration}
          toggle={handleModalActive}
          reload={reload}
          rangeId={rangeId}
        />
      )}

      {Object.entries(groupedConfigurations).map(([group, values]) => (
        <details open className="mt-2 outline-none">
          <summary>
            <b>{group}</b>
          </summary>
          <table className="w-full h-fit">
            <thead>
              <tr>
                {columns.map((column) => {
                  return <th key={column}>{column}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {Object.values(values).map((configuration: Configuration) => {
                return (
                  <tr
                    className="hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => {
                      setConfiguration(configuration);
                      setModalActive(true);
                    }}
                    key={configuration.id}
                  >
                    <td>{configuration.id}</td>
                    <td>{String(configuration.mustReboot)}</td>
                    <td>
                      {confDescriptions[configuration.key]?.name ??
                        configuration.key}
                    </td>
                    <td>
                      {JSON.stringify(configuration.value).substring(0, 50)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      ))}
      <ToastContainer />
    </div>
  );
};
