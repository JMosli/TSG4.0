import { FormEvent, useState } from "react";
import "@component/Modal/CreateCameraModal/CreateCameraModal.css";
import { useParams } from "react-router-dom";
import useLocalApi from "@utils/hooks/useLocalApi";

type Props = {
  toggle: () => void;
};

export const CreateCameraModal = ({ toggle }: Props) => {
  const { rangeId } = useParams<{ rangeId: string }>();
  const api = useLocalApi(rangeId!);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = Object.fromEntries([...formData]);

    if (!data.ip_address.toString().trim() || !data.port.toString().trim())
      return setError("No ip or port");

    if (isNaN(+data.port) || +data.port > 65535)
      return setError("Wrong port value");

    const ipSplit = (data.ip_address as string)?.split(".");

    if (ipSplit.length !== 4)
      return setError("Wrong ip: octet number is not equal to 4");

    if (!ipSplit.every((octet) => !isNaN(+octet) && +octet < 255))
      return setError("Wrong ip: wrong octet format ");

    api.camera.connectCamera({
      ip_address: data.ip_address as string,
      port: +data.port,
    });
    toggle();
  };

  return (
    <div className="modal">
      <div className="overlay">
        <div className="modal-content bg-neutral-900 rounded-xl p-6">
          <h3 className="mb-4">Create new camera</h3>
          <form
            className="modal-data flex flex-col gap-2"
            onSubmit={handleSubmit}
          >
            <label htmlFor="ip_address">Ip address: </label>
            <input className="p-2" type="text" name="ip_address" />

            <label htmlFor="port">Port: </label>
            <input className="p-2" type="text" name="port" />

            {error && <b className="text-red-600">{error}</b>}
            <button type="submit">Add</button>
          </form>
        </div>
        <button className="close-modal" onClick={toggle}>
          CLOSE
        </button>
      </div>
    </div>
  );
};
