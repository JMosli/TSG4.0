import { combineReducers, configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import wsSlice from "./slice/ws/wsSlice";
import apiSlice from "./slice/globalApi/apiSlice";
import rangeSlice from "./slice/range/rangeSlice";

const persistConfig = {
  key: "root",
  storage: storage,
  whitelist: ["api"],
};

const rootReducers = combineReducers({
  ws: wsSlice,
  api: apiSlice,
  range: rangeSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducers);

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

export const persistor = persistStore(makeStore());
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducers>;
export type AppDispatch = AppStore["dispatch"];
