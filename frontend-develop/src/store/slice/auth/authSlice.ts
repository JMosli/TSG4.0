import { createSlice } from "@reduxjs/toolkit";
import { InitialAuthState } from "@store/slice/auth/types";

const initialState: InitialAuthState = {
  token: "",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    putToken: (state, action) => {
      state.token = action.payload;
    },
    getToken: (state) => {
      state.token = "";
    },
  },
});

export const { putToken, getToken } = authSlice.actions;
export default authSlice.reducer;
