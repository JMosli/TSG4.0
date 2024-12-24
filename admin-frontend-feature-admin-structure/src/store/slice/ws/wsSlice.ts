import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { io, Socket } from "socket.io-client";

type InitialState = {
  camera: Socket | null;
  openedRange: number | null;
};

const initialState: InitialState = {
  camera: null,
  openedRange: null,
};

export const wsSlice = createSlice({
  name: "ws",
  initialState,
  reducers: {
    openRange: (state, action: PayloadAction<number>) => {
      if (state.openedRange === action.payload) return;

      //@ts-expect-error
      state.camera = io(import.meta.env.VITE_WS_URL, {
        path: "/range/ws",
        transports: ["websocket"],
        query: {
          range: action.payload,
          path: "/socket.io/camera?transport=websocket&EIO=4",
          isVideoProxy: false,
        },
        addTrailingSlash: false,
        autoConnect: false,
      });
      //@ts-expect-error
      state.camera.nsp = "/camera";

      state.camera?.connect();

      state.openedRange = action.payload;
    },
  },
});

export const { openRange } = wsSlice.actions;
export default wsSlice.reducer;
