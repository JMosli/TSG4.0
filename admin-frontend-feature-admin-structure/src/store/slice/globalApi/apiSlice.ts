import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { globalApi } from "@store/api";
import { createAppAsyncThunk } from "@store/hooks";
import { User } from "frontend-sdk/dist/global/auth/types";
import { ApiResponse } from "frontend-sdk/dist/response";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";

type State = {
  token: string;
  user: null | ObjectToCamel<User>;
};

const initialState: State = {
  token: "",
  user: null,
};

export const getUser = createAppAsyncThunk(
  "api/getUser",
  async (_: {}, thunkApi) => {
    const state = thunkApi.getState();
    const token = state.api.token;

    globalApi.requester.token = token;
    return globalApi.auth.getMe();
  }
);

export const apiSlice = createSlice({
  name: "globalApi",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setUser: (state, action: PayloadAction<ObjectToCamel<User | null>>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getUser.fulfilled, (state, action) => {
      const [user, error] = action.payload.transpose();
      if (error) {
        state.user = null;
        state.token = "";
        return;
      }

      state.user = user;
    });
  },
});

export const { setToken, setUser } = apiSlice.actions;
export default apiSlice.reducer;
