import useGlobalApi from "@utils/hooks/useGlobalApi";
import { useEffect, useMemo, useState } from "react";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RetrieveUserResponse } from "frontend-sdk/dist/global/users/types";
import { ButtonLoading } from "@component";
import { Paginated } from "frontend-sdk/dist/types";
import {
  Range,
  UpdateRangeRequest,
  UserConnectRequest,
} from "frontend-sdk/dist/global/range/types";
import RangeSelectorModal from "@component/Modal/RangeSelectorModal";

type UserState = ObjectToCamel<RetrieveUserResponse> | null;
type RangeState = Paginated<ObjectToCamel<Range>> | null;
type SelectingRangeState = {
  action: "so" | "owner";
  isConnecting: boolean;
};

export default function UserPage() {
  const { userId } = useParams<{ userId: string }>();
  const globalApi = useGlobalApi();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserState>(null);
  const [ranges, setRanges] = useState<RangeState>(null);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [selectingRange, setSelectingRange] =
    useState<SelectingRangeState | null>(null);

  const filteredRanges = useMemo(() => {
    if (!user || !ranges) return;
    const key =
      selectingRange?.action === "owner" ? "ownerOf" : "securityGuardOf";

    return ranges?.items.filter(
      (r) =>
        !!user[key].find((o) => o.id === r.id) == !selectingRange?.isConnecting
    );
  }, [ranges, selectingRange]);

  const List = ({
    list,
    namespace,
  }: {
    list: { name: string; id: number }[];
    namespace: string;
  }) => {
    if (!list.length) return "(none)";

    return (
      <div className="flex flex-row gap-2">
        {list.map((item) => (
          <Link key={item.id} to={`/${namespace}/${item.id}`}>
            {item.name ?? item.id}
          </Link>
        ))}
      </div>
    );
  };

  const loadUser = (id: number) =>
    globalApi.users
      .retrieve(id)
      .then((res) => res.transpose())
      .then(([user, error]) =>
        user ? setUser(user) : setError(error.message as string)
      );

  const loadRanges = () =>
    globalApi.range
      .list({ take: 20, skip })
      .then((res) => res.transpose())
      .then(([ranges, error]) =>
        ranges ? setRanges(ranges) : setError(error.message as string)
      );

  const setModalMode = (
    action: SelectingRangeState["action"],
    isConnecting: boolean
  ) => {
    setSelectingRange({ action, isConnecting });
  };

  const handleRangeSelection = async (range: ObjectToCamel<Range>) => {
    if (!user || !selectingRange) return;

    const request: UpdateRangeRequest = {};
    const connector: UserConnectRequest = {};

    if (selectingRange.isConnecting) connector.connect = [user.id];
    else connector.disconnect = [user.id];

    if (selectingRange.action === "owner") request.owners = connector;
    else request.security_guards = connector;

    await globalApi.range.update(range.id, request);

    loadUser(+userId!);
    setSelectingRange(null);
  };

  useEffect(() => {
    if (!userId || isNaN(+userId)) return setError("User id not found!");

    loadUser(+userId);
    loadRanges();
  }, []);

  if (error || !user) return <>{error}</>;

  return (
    <main>
      {selectingRange && ranges && filteredRanges && (
        <RangeSelectorModal
          ranges={{ count: ranges.count, items: filteredRanges }}
          setSkip={setSkip}
          selected={handleRangeSelection}
          toggle={() => setSelectingRange(null)}
        />
      )}
      <h3>
        User <i>{user.username}</i> ({user.id}){" "}
        {user.isGlobalAdmin && <b>(global admin)</b>} (
        <Link to="/user">back</Link>)
      </h3>
      <div className="flex flex-col gap-3 mt-3">
        <b>
          Email: <a href={`mail:${user.email}`}>{user.email}</a>
        </b>
        <span>
          Owned ranges: <List list={user.ownerOf} namespace="range" />
        </span>
        <span>
          Security guard on:{" "}
          <List list={user.securityGuardOf} namespace="range" />
        </span>
        <span>
          Created users:{" "}
          <List
            list={user.createdUsers.map((user) => ({
              ...user,
              name: user.username,
            }))}
            namespace="user"
          />
        </span>

        <button onClick={() => setModalMode("owner", true)}>
          Add as range owner
        </button>
        <button onClick={() => setModalMode("owner", false)}>
          Remove as owner
        </button>

        <button onClick={() => setModalMode("so", true)}>
          Add as security guard
        </button>
        <button onClick={() => setModalMode("so", false)}>
          Remove as security guard
        </button>

        <ButtonLoading
          className="w-fit text-red-600 border border-red-800"
          onTap={() => {
            if (confirm("Are you sure you want to remove this user?"))
              return globalApi.users
                .remove(user.id)
                .then((res) => res.transpose())
                .then(([_, error]) => (error ? null : navigate(`/user`)));
            return Promise.resolve();
          }}
        >
          Remove user
        </ButtonLoading>
      </div>
    </main>
  );
}
