import { Graph } from "@component/Statistic/PriceMediana";
import useGlobalApi from "@utils/hooks/useGlobalApi";
import {
  PaymentPriceStatistics,
  PaymentStatusStatistics,
  PollStatistics,
} from "frontend-sdk/dist/global/statistic/types";
import { useState, useMemo, useEffect } from "react";
import DatePicker from "react-datepicker";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import "react-datepicker/dist/react-datepicker.css";

type PriceState = ObjectToCamel<PaymentPriceStatistics> | null;
type StatusState = ObjectToCamel<PaymentStatusStatistics> | null;
type PollStatus = ObjectToCamel<PollStatistics> | null;

/**
 * Range statistics. If rangeId is not set, it will show global statistics
 */
export function RangeStatistics({ rangeId }: { rangeId?: number }) {
  const globalApi = useGlobalApi();

  const [priceStats, setPriceStats] = useState<PriceState>(null);
  const [statusStats, setStatusStats] = useState<StatusState>(null);
  const [pollStats, setPollStats] = useState<PollStatus>(null);
  const [visitorCounter, setVisitorCounter] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const priceData = useMemo(
    () =>
      priceStats?.priceByDay.map((price) => ({
        ...price,
        date: new Date(price.date).toLocaleDateString("en-GB"),
      })),
    [priceStats]
  );

  const statusData = useMemo(
    () =>
      statusStats?.statusByDay.map((status) => ({
        ...status,
        date: new Date(status.date).toLocaleDateString("en-GB"),
      })),
    [statusStats]
  );

  const pollData = useMemo(
    () =>
      pollStats?.grouped.map((q) => ({
        name: q.question.toString(),
        ...Object.fromEntries(q.answers.map((a) => [a.answer, a.count])),
      })),
    [pollStats]
  );

  useEffect(() => {
    globalApi.statistic
      .paymentPrice(
        rangeId,
        startDate && endDate
          ? [startDate.getTime() / 1000, endDate.getTime() / 1000]
          : undefined
      )
      .then((res) => res.transpose())
      .then(([stat, error]) =>
        stat ? setPriceStats(stat) : setError(error.message as string)
      );
  }, [startDate, endDate]);

  useEffect(() => {
    globalApi.statistic
      .paymentStatus(rangeId)
      .then((res) => res.transpose())
      .then(([stat, error]) =>
        stat ? setStatusStats(stat) : setError(error.message as string)
      );

    globalApi.statistic
      .poll(rangeId)
      .then((res) => res.transpose())
      .then(([stat, error]) =>
        stat ? setPollStats(stat) : setError(error.message as string)
      );

    globalApi.statistic
      .visitorCounter(rangeId)
      .then((res) => res.transpose())
      .then(([counter, error]) =>
        counter
          ? setVisitorCounter(counter.visitors)
          : setError(error.message as string)
      );
  }, []);

  return (
    <div className="flex flex-col gap-4 mt-4 w-full">
      <div className="flex flex-row gap-8 border border-neutral-700 p-2 rounded-lg">
        {priceStats && statusStats ? (
          <div className="flex flex-col">
            <b>
              Average price per sale: ${" "}
              {Math.round(priceStats?.totals.Avg.price) / 100}
            </b>
            <b>
              Total sales: $ {Math.round(priceStats?.totals.Sum.price) / 100}
            </b>
            <b>Total active payments: {statusStats.totals.active}</b>
          </div>
        ) : (
          "Loading"
        )}
        {statusStats && visitorCounter ? (
          <div className="flex flex-col">
            <b>Total inactive payments: {statusStats.totals.inactive}</b>
            <b>Kiosk visitors: {visitorCounter}</b>
          </div>
        ) : (
          "Loading..."
        )}
        <div className="flex flex-col gap-2">
          <DatePicker
            className="border border-neutral-500 p-1 rounded-lg outline-none"
            selected={startDate}
            onChange={(d) => d && setStartDate(d)}
            placeholderText="Start date"
            dateFormat="dd.MM.YYYY"
          />
          <DatePicker
            className="border border-neutral-500 p-1 rounded-lg outline-none"
            selected={endDate}
            onChange={(d) => d && setEndDate(d)}
            placeholderText="End date"
            dateFormat="dd.MM.YYYY"
          />
        </div>
        <div className="flex flex-col gap-2">
          <button
            className="p-1 px-4"
            onClick={() => {
              setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
              setEndDate(new Date());
            }}
          >
            Month
          </button>
          <button
            className="p-1 px-4"
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            All time
          </button>
        </div>
      </div>
      <div className="flex flex-row gap-4 w-full mt-2">
        <div className="flex flex-col gap-2 items-center w-full">
          <b>Total price by date</b>
          {priceData ? (
            <Graph
              data={priceData}
              charts={[{ valueName: "Price (cents)", dataKey: "totalPrice" }]}
            />
          ) : (
            "Loading..."
          )}
        </div>
        <div className="flex flex-col gap-2 items-center w-full">
          <b>Payment status by date</b>
          {statusData ? (
            <Graph
              data={statusData}
              charts={[
                { valueName: "Active payments", dataKey: "activeCount" },
                {
                  valueName: "Inactive payments",
                  dataKey: "inactiveCount",
                  color: "#82ca9d",
                },
              ]}
            />
          ) : (
            "Loading..."
          )}
        </div>
        <div className="flex flex-col gap-2 items-center w-full">
          <b>Poll status</b>
          {pollData ? (
            <ResponsiveContainer className="w-full" height={500}>
              <BarChart
                width={500}
                height={300}
                data={pollData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="1" stackId="a" fill="#8884d8" />
                <Bar dataKey="2" stackId="a" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            "Loading..."
          )}
        </div>
      </div>
    </div>
  );
}
