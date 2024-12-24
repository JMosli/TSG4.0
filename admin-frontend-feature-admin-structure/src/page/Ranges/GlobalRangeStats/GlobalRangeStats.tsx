import { PaginationControl } from "@component/Pagination";
import { RangeStatistics } from "@component/RangeStatistics/RangeStatistics";
import useGlobalApi from "@utils/hooks/useGlobalApi";
import { PriceByRangeStatistics } from "frontend-sdk/dist/global/statistic/types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";

export default function GlobalRangeStats() {
  const globalApi = useGlobalApi();

  const [priceByRange, setPriceByRange] =
    useState<ObjectToCamel<PriceByRangeStatistics> | null>(null);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);

  useEffect(() => {
    globalApi.statistic
      .priceByRange({ take: 20, skip })
      .then((res) => res.transpose())
      .then(([stats, error]) =>
        stats ? setPriceByRange(stats) : setError(error.message as string)
      );
  }, [skip]);

  if (error || !priceByRange) return <>{error}</>;

  return (
    <main>
      <h3>
        Global statistics (<Link to="/range">back</Link>)
      </h3>
      <div className="h-[1px] w-full bg-neutral-600 my-4"></div>
      <div className="flex flex-col gap-6 mt-2 w-full">
        <div className="flex flex-col gap-3 w-full items-center">
          <h4>Ranges by total sell descending</h4>
          <table className="w-full h-fit">
            <thead>
              <tr>
                <th>Id</th>
                <th>Address</th>
                <th>Name</th>
                <th>Total sells</th>
              </tr>
            </thead>
            <tbody>
              {priceByRange.items.map((range) => (
                <tr>
                  <td>{range.id}</td>
                  <td>{range.ipAddress}</td>
                  <td>{range.name}</td>
                  <td>{range.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControl
            onPageChange={setSkip}
            maxPage={Math.ceil(priceByRange.count / 20)}
            startPage={0}
            take={20}
          />
        </div>
        <div className="h-[1px] w-full bg-neutral-600 my-2"></div>
        <RangeStatistics />
      </div>
    </main>
  );
}
