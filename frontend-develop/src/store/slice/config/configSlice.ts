import { createSlice, GetThunkAPI, PayloadAction } from "@reduxjs/toolkit";
import { createAppAsyncThunk } from "@store/hooks";
import { RootState } from "@store/store";
import { Api } from "frontend-sdk";
import { Configuration } from "frontend-sdk/dist/configuration/types";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";

type InitialState = {
  config: ObjectToCamel<Configuration>[];
};

const initialState: InitialState = {
  config: [],
};

const getApi = (thunkAPI: GetThunkAPI<{ state: RootState }>) => {
  const state = thunkAPI.getState();
  const token = state.auth.token;

  return new Api(import.meta.env.VITE_BACKEND_URL, token);
};

export const getConfig = createAppAsyncThunk(
  "config/getConfig",
  (_, thunkAPI) => {
    return getApi(thunkAPI).configuration.getFullConfiguration();
  }
);

/**
 * Returns a config value
 */
export const getConfValue = <T>(
  config: InitialState["config"],
  key: string
): T | null => {
  if (config.length === 0) return null;

  const value = config.filter((v) => v.key === key).at(0);
  if (!value) return null;

  return value.value as T;
};

export const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getConfig.fulfilled, (state, action) => {
      const [config, error] = action.payload.transpose();
      if (error) return;

      state.config = config;
    });
  },
});

export default configSlice.reducer;
