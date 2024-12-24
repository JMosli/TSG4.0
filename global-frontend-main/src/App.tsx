import { BrowserRouter, Route, Routes } from "react-router-dom";
import PaymentPage from "./pages/PaymentPage";
import "./App.css";
import "./Modal.css";
import BuyMediaPage from "./pages/BuyMediaPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/payment/:uid" element={<PaymentPage />} />
        <Route path="/bm" element={<BuyMediaPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
