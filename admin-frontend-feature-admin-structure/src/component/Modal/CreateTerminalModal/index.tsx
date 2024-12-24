import useLocalApi from "@utils/hooks/useLocalApi";
import { FormEvent, useState } from "react";

type Props = {
  toggle: () => void;
  reload: () => void;
  kioskId: number;
  rangeId: string;
};

export default function CreateTerminalModal({
  toggle,
  reload,
  kioskId,
  rangeId,
}: Props) {
  const api = useLocalApi(rangeId);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = Object.fromEntries([...formData]) as unknown as {
      reader_id: string;
    };

    if (!data.reader_id) return setError("Enter a reader id");

    await api.terminal.create({
      kiosk_id: kioskId,
      reader_id: data.reader_id,
    });

    toggle();
    reload();
  };

  return (
    <div className="modal">
      <div className="overlay">
        <div className="modal-content bg-neutral-900 rounded-xl p-6">
          <h3 className="mb-4">Create new terminal</h3>
          <form
            className="modal-data flex flex-col gap-2"
            onSubmit={handleSubmit}
          >
            <label htmlFor="reader_id">Reader id from stripe: </label>
            <input className="p-2" type="text" name="reader_id" />

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
