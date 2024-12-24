import { Range } from "frontend-sdk/dist/global/range/types";
import { ObjectToCamel } from "ts-case-convert";

export default function RangeTable({
  ranges,
  onClick,
}: {
  ranges: ObjectToCamel<Range>[];
  onClick: (range: ObjectToCamel<Range>) => void;
}) {
  return (
    <>
      <table className="w-full h-fit">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {ranges.map((range) => (
            <tr
              className="hover:bg-gray-800 transition-colors cursor-pointer"
              onClick={() => onClick(range)}
            >
              <td>{range.id}</td>
              <td>{range.name}</td>
              <td>{range.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
