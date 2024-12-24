import { ButtonLoading } from "@component/ButtonLoading";
import { Configuration } from "@component/Table/ConfigurationTable/types";
import useLocalApi from "@utils/hooks/useLocalApi";
import { useState } from "react";
import { confDescriptions } from "./descriptions";

type Props = {
  toggle: () => void;
  reload: () => void;
  currentConf: Configuration | null;
  rangeId: string;
};

export const CreateConfigurationModal = ({
  toggle,
  currentConf,
  rangeId,
  reload,
}: Props) => {
  const api = useLocalApi(rangeId);

  const [key, setKey] = useState(currentConf?.key);
  const [value, setValue] = useState(JSON.stringify(currentConf?.value));
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      JSON.parse(value);
    } catch {
      return setError("Wrong JSON value");
    }

    if (!key) return setError("Key is not specified");

    const [resp, error] = (await api.configuration.set(key, value)).transpose();
    if (error) return setError(error.message as string);

    toggle();
    reload();
  };

  return (
    <div className="modal">
      <div className="overlay">
        <div className="modal-content bg-neutral-900 rounded-xl p-6">
          <h2>Update configuration</h2>
          <div className="modal-data flex flex-col gap-3 mt-3">
            <label htmlFor="key">
              Key{" "}
              {key && confDescriptions[key] && (
                <>
                  (<i>{confDescriptions[key].name}</i>)
                </>
              )}
              :{" "}
            </label>
            <input
              className="p-2"
              type="text"
              name="key"
              placeholder="Key"
              value={key}
              onChange={(e) =>
                currentConf ? null : setKey(e.currentTarget.value)
              }
            />

            <label htmlFor="value">Value: </label>
            <input
              className="p-2"
              type="text"
              name="value"
              placeholder="{}"
              value={value}
              onChange={(e) => setValue(e.currentTarget.value)}
            />

            {error && <b className="text-red-600">{error}</b>}
            {key && confDescriptions[key] && (
              <i className="whitespace-pre-wrap">
                {confDescriptions[key].description}
              </i>
            )}
            <ButtonLoading onTap={handleSubmit}>Update</ButtonLoading>
          </div>
        </div>
        <button className="close-modal" onClick={toggle}>
          CLOSE
        </button>
      </div>
    </div>
  );
};
