import { createSlice } from "@reduxjs/toolkit";
import { io } from "socket.io-client";

const initialState = {
  camera: io(import.meta.env.VITE_WS_URL + "/camera"),
  payment: io(import.meta.env.VITE_WS_URL + "/payment"),
};

export const wsSlice = createSlice({
  name: "ws",
  initialState,
  reducers: {},
});

export default wsSlice.reducer;
