import { ButtonLoading } from "@component/ButtonLoading";
import useLocalApi from "@utils/hooks/useLocalApi";
import { wait } from "@utils/utils";
import { FormEvent, useState } from "react";
import { toBase64 } from "./utils";

export default function ChangeLogoModal({
  rangeId,
  toggle,
  reload,
}: {
  rangeId: string;
  toggle: () => void;
  reload: () => void;
}) {
  const api = useLocalApi(rangeId);

  const [networkLoad, setNetworkLoad] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const logo = formData.get("logo");

    let logoString = "";

    if (networkLoad) logoString = logo as string;
    else logoString = await toBase64(logo as File);

    await api.configuration.set("ui.kiosk.logo", JSON.stringify(logoString));

    toggle();
    reload();
  };

  return (
    <div className="modal">
      <div className="overlay">
        <div className="modal-content bg-neutral-900 rounded-xl p-6">
          <h2>Update UI logo</h2>
          <form
            className="modal-data flex flex-col gap-3 mt-3"
            onSubmit={handleSubmit}
          >
            <label>
              Load from network:{" "}
              <input
                type="checkbox"
                onChange={(ev) => setNetworkLoad(ev.currentTarget.checked)}
              />
            </label>

            {networkLoad ? (
              <label>
                Link: <input placeholder="http://" name="logo" />
              </label>
            ) : (
              <label>
                File: <input type="file" name="logo" />
              </label>
            )}

            <ButtonLoading onTap={() => wait(10 * 1000)}>Update</ButtonLoading>
          </form>
        </div>
        <button className="close-modal" onClick={toggle}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
