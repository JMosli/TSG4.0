import { useAppSelector } from "@store/hooks";
import useGlobalApi from "@utils/hooks/useGlobalApi";
import { CreateUserRequest } from "frontend-sdk/dist/global/users/types";
import { FormEvent, useState } from "react";

type Props = {
  toggle: () => void;
  reload: () => void;
};

export default function CreateUserModal({ toggle, reload }: Props) {
  const globalApi = useGlobalApi();
  const me = useAppSelector((state) => state.api.user);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = Object.fromEntries([
      ...formData,
    ]) as unknown as CreateUserRequest;

    if (me?.isGlobalAdmin)
      data.is_global_admin = !!formData.get("is_global_admin");

    if (!data.email || !data.username || !data.password)
      return setError("Some fields are empty!");

    const [response, error] = (await globalApi.users.create(data)).transpose();
    if (error) return setError(error.message as string);

    toggle();
    reload();
  };

  return (
    <div className="modal">
      <div className="overlay">
        <div className="modal-content bg-neutral-900 rounded-xl p-6">
          <h3 className="mb-4">Create new user</h3>
          <form
            className="modal-data flex flex-col gap-2"
            onSubmit={handleSubmit}
          >
            <label htmlFor="username">Username: </label>
            <input className="p-2" type="text" name="username" />

            <label htmlFor="email">Email: </label>
            <input className="p-2" type="text" name="email" />

            <label htmlFor="password">Password: </label>
            <input className="p-2" type="text" name="password" />

            {me?.isGlobalAdmin && (
              <label htmlFor="is_global_admin" className="flex flex-row gap-2">
                Is global admin:
                <input className="p-2" type="checkbox" name="is_global_admin" />
              </label>
            )}

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
