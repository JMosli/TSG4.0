import { createSlice } from "@reduxjs/toolkit";
import { createAppAsyncThunk } from "@store/hooks";
import { GlobalApi } from "frontend-sdk";
import { RangeWithUsers } from "frontend-sdk/dist/global/range/types";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";

type InitialState = {
  range: ObjectToCamel<RangeWithUsers> | null;
};

const initialState: InitialState = {
  range: null,
};

export const loadRange = createAppAsyncThunk(
  "range/load",
  async (id: number, thunkAPI) => {
    const state = thunkAPI.getState();
    if (state.range.range?.id === id) return;

    const api = new GlobalApi(
      import.meta.env.VITE_BACKEND_URL,
      state.api.token
    );
    return api.range.retrieve(id);
  }
);

export const rangeSlice = createSlice({
  name: "range",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loadRange.fulfilled, (state, action) => {
      if (!action.payload) return;

      const [response, error] = action.payload.transpose();
      if (error) {
        state.range = null;
        return;
      }

      state.range = response;
    });
  },
});

export default rangeSlice.reducer;
