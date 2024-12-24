import { useAppDispatch, useAppSelector } from "@store/hooks";
import { loadRange } from "@store/slice/range/rangeSlice";
import { useEffect } from "react";

export default function useRange(rangeId: number | null) {
  const { range } = useAppSelector((state) => state.range);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (range?.id === rangeId) return;
    if (!rangeId) return;

    dispatch(loadRange(rangeId));
  }, []);

  return range;
}
