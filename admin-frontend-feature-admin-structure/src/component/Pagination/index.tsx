import { useState } from "react";

type Props = {
    onPageChange: (skip: number) => void;
    take: number;
    startPage: number;
    maxPage: number;
};

export function PaginationControl(props: Props) {
    const [page, setPage] = useState(props.startPage);

    const applyPage = (newPage: number) => {
        setPage(newPage);
        props.onPageChange(newPage * props.take);
    };

    return (
        <div className="flex flex-row gap-2">
      <span
          className="cursor-pointer"
          onClick={() => applyPage(Math.max(page - 1, 0))}
      >
        {"<"}
      </span>
            <span>{page}</span>
            <span
                className="cursor-pointer"
                onClick={() => applyPage(Math.min(page + 1, props.maxPage))}
            >
        {">"}
      </span>
        </div>
    );
}
