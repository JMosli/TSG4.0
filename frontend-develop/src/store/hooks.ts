import { AppDispatch, AppStore, RootState } from "@store/store";
import { useDispatch, useSelector, useStore } from "react-redux";
import { createAsyncThunk, ThunkAction } from "@reduxjs/toolkit";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

export type AppThunk<Returns> = ThunkAction<Returns, RootState, undefined, any>;

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();
