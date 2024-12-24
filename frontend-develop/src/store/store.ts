import { combineReducers, configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import authSlice from '@store/slice/auth/authSlice';
import wsSlice from '@store/slice/ws/wsSlice';
import configSlice from './slice/config/configSlice';
import cartSlice from '@store/slice/cart/cartSlice';

const persistConfig = {
  key: 'root',
  storage: storage,
  whitelist: [ 'auth' ],
};

const rootReducers = combineReducers({
  auth: authSlice,
  ws: wsSlice,
  config: configSlice,
  cart: cartSlice
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
export type AppDispatch = AppStore['dispatch'];
