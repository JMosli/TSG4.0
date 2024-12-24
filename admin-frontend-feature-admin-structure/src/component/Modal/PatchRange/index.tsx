import { useAppSelector } from "@store/hooks";
import { User } from "frontend-sdk/dist/global/auth/types";
import { RangeWithUsers } from "frontend-sdk/dist/global/range/types";
import { FormEvent, useState } from "react";
import { TagsInput } from "react-tag-input-component";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import { globalApi } from "../../../store/api";
import useGlobalApi from "@utils/hooks/useGlobalApi";

type Props = {
  toggle: () => void;
  reload: () => void;
  range: ObjectToCamel<RangeWithUsers>;
};

const separators = ["Enter", " ", ","];

export default function PatchRangeModal({ range, toggle, reload }: Props) {
  const me = useAppSelector((state) => state.api.user);
  const globalApi = useGlobalApi();

  const [error, setError] = useState("");
  const [owners, setOwners] = useState(
    range.owners.map((u) => u.id.toString())
  );
  const [securityGuards, setSecurityGuards] = useState(
    range.securityGuards.map((u) => u.id.toString())
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (owners.some((o) => isNaN(+o)) || securityGuards.some((s) => isNaN(+s)))
      return setError("Only numbers can be entered as user ids!");

    if (!owners.some((o) => o === me?.id.toString()))
      return setError("You can not remove yourself from owners!");

    const getNewUsers = (ids: string[], userList: Array<{ id: number }>) =>
      ids
        .filter((id) => !userList.filter((u) => u.id.toString() === id)[0])
        .map((id) => +id);

    const getRemovedUsers = (ids: string[], userList: Array<{ id: number }>) =>
      userList
        .filter((u) => !ids.filter((id) => id === u.id.toString())[0])
        .map((u) => u.id);

    const request = {
      owners: {
        connect: getNewUsers(owners, range.owners),
        disconnect: getRemovedUsers(owners, range.owners),
      },
      security_guards: {
        connect: getNewUsers(securityGuards, range.securityGuards),
        disconnect: getRemovedUsers(securityGuards, range.securityGuards),
      },
    };

    const [response, error] = (
      await globalApi.range.update(range.id, request)
    ).transpose();

    if (error) return setError(error.message as string);

    toggle();
    reload();
  };

  return (
    <div className="modal">
      <div className="overlay">
        <div className="modal-content bg-neutral-900 rounded-xl p-6">
          <h3 className="mb-4">Change range parameters</h3>
          <form
            className="modal-data flex flex-col gap-2"
            onSubmit={handleSubmit}
          >
            <label>
              <b className="text-xl">Owners:</b>
              <TagsInput
                value={owners}
                onChange={setOwners}
                separators={separators}
                name="owners"
                placeHolder="Enter owner id"
              />
            </label>
            <label>
              <b className="text-xl">Security guards:</b>
              <TagsInput
                value={securityGuards}
                onChange={setSecurityGuards}
                separators={separators}
                name="security_guards"
                placeHolder="Enter SO id"
              />
            </label>

            {error && <b className="text-red-600">{error}</b>}
            <button type="submit">Change</button>
          </form>
        </div>
        <button className="close-modal" onClick={toggle}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
