import { PaginationControl } from "@component/Pagination";
import RangeTable from "@component/Table/RangeTable";
import { useAppSelector } from "@store/hooks";
import useGlobalApi from "@utils/hooks/useGlobalApi";
import useLocalApi from "@utils/hooks/useLocalApi";
import { Range } from "frontend-sdk/dist/global/range/types";
import { CreateUserRequest } from "frontend-sdk/dist/global/users/types";
import { Paginated } from "frontend-sdk/dist/types";
import { FormEvent, useState } from "react";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";

type Props = {
  toggle: () => void;
  selected: (range: ObjectToCamel<Range>) => void;
  ranges: Paginated<ObjectToCamel<Range>>;
  setSkip: (skip: number) => void;
};

export default function RangeSelectorModal({
  toggle,
  selected,
  setSkip,
  ranges,
}: Props) {
  const api = useGlobalApi();

  return (
    <div className="modal">
      <div className="overlay">
        <div className="modal-content bg-neutral-900 rounded-xl p-6">
          <h3 className="mb-4">Select a range</h3>
          <RangeTable ranges={ranges.items} onClick={selected} />
          <PaginationControl
            onPageChange={setSkip}
            maxPage={Math.floor(ranges.count / 20)}
            startPage={0}
            take={20}
          />
        </div>
        <button className="close-modal" onClick={toggle}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
