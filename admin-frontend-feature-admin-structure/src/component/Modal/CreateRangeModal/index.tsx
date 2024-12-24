import { useAppSelector } from "@store/hooks";
import useGlobalApi from "@utils/hooks/useGlobalApi";
import { CreateRangeRequest } from "frontend-sdk/dist/global/range/types";
import { FormEvent, useState } from "react";

type Props = {
  toggle: () => void;
  reload: () => void;
};

export default function CreateRangeModal({ toggle, reload }: Props) {
  const api = useGlobalApi();
  const me = useAppSelector((state) => state.api.user);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = Object.fromEntries([
      ...formData,
    ]) as unknown as CreateRangeRequest;

    data.owner_user_id = me!.id;

    const [range, error] = (await api.range.create(data)).transpose();
    if (error) return setError(error.message.toString());

    toggle();
    reload();
  };

  if (!me) return <>Error</>;

  return (
    <div className="modal">
      <div className="overlay">
        <div className="modal-content bg-neutral-900 rounded-xl p-6">
          <h3 className="mb-4">Create new terminal</h3>
          <form
            className="modal-data flex flex-col gap-2"
            onSubmit={handleSubmit}
          >
            <label htmlFor="ip_address">Local server ip: </label>
            <input className="p-2" type="text" name="ip_address" />

            <label htmlFor="name">Name: </label>
            <input className="p-2" type="text" name="name" />

            {error && <b className="text-red-600">{error}</b>}
            <button type="submit">Create</button>
          </form>
        </div>
        <button className="close-modal" onClick={toggle}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
