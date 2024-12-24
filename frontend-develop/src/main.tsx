import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import { App } from "@/App";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { makeStore, persistor } from "@store/store";
import { persistStore } from "redux-persist";

const store = makeStore();
persistStore(store);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
);
