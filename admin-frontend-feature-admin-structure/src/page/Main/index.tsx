import NavigationLinks from "@component/NavigationLinks";
import { PaginationControl } from "@component/Pagination";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setToken, setUser } from "@store/slice/globalApi/apiSlice";
import { Range } from "frontend-sdk/dist/global/range/types";
import { Paginated } from "frontend-sdk/dist/types";
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import useGlobalApi from "@utils/hooks/useGlobalApi";
import useUserPermissions from "@utils/hooks/useUserPermissions";
import CreateRangeModal from "@component/Modal/CreateRangeModal";
import RangeTable from "@component/Table/RangeTable";

export const MainPage = () => {
  const me = useAppSelector((state) => state.api.user);
  const globalApi = useGlobalApi();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [ranges, setRanges] = useState<Paginated<ObjectToCamel<Range>> | null>(
    null
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);

  const load = () => {
    globalApi.range
      .list({ take: 20, skip })
      .then((res) => res.transpose())
      .then(([ranges, error]) =>
        ranges ? setRanges(ranges) : setError(error.message as string)
      );
  };

  useEffect(load, [skip]);

  if (!ranges || error) return <>{error}</>;

  return (
    <div className="flex flex-col gap-4 items-center">
      {creating && me?.isGlobalAdmin && (
        <CreateRangeModal toggle={() => setCreating(false)} reload={load} />
      )}
      <h4>
        Logged in as{" "}
        <i>
          {me?.isGlobalAdmin ? `global admin ` : ""}
          <b>{me?.username}</b>
        </i>
        . Select a page:
      </h4>
      <NavigationLinks />
      <div className="flex flex-row gap-2">
        <button
          className="text-red-600"
          onClick={() => {
            dispatch(setToken(""));
            dispatch(setUser(null));
          }}
        >
          Logout
        </button>
        <button onClick={() => setCreating(true)}>Create new range</button>
      </div>
      <div className="flex flex-col gap-2 w-full items-center mt-5">
        <h4>Select a range:</h4>
        <RangeTable
          ranges={ranges.items}
          onClick={(range) => navigate(`/range/${range.id}`)}
        />
        <PaginationControl
          onPageChange={setSkip}
          maxPage={Math.floor(ranges.count / 20)}
          startPage={0}
          take={20}
        />
      </div>
    </div>
  );
};
