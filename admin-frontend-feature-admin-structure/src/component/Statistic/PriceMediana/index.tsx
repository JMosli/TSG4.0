import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  active?: any;
  payload?: any;
  label?: any;
};

type GraphData = {
  [key: string]: number | string;
} & { date: string };

type Chart = {
  valueName: string;
  dataKey: string;
  color?: string;
};

type GraphProps = {
  data: GraphData[];
  charts: Chart[];
};

const CustomTooltip = ({ active, payload, label }: Props) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="custom-tooltip"
        style={{ background: "#fff", color: "#000" }}
      >
        <p className="label">{`${label} : ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

export const Graph = (props: GraphProps) => {
  return (
    <>
      <ResponsiveContainer className="w-full" height={500}>
        <LineChart
          width={500}
          height={300}
          data={props.data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" dy={10} dx={30} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {props.charts.map((chart) => (
            <Line
              type="monotone"
              dataKey={chart.dataKey}
              stroke={chart.color ?? "#8884d8"}
              name={chart.valueName}
              activeDot={{ r: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};
