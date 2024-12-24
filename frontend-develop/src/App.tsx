import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import "react-toastify/dist/ReactToastify.css";
import { BuyPage } from "@view/BuyPage/BuyPage";
import { ThankYouPaymentPage } from "@view/ThankYouPaymentPage/ThankYouPaymentPage";
import { QrCodePage } from "@view/QrCodePage/QrCodePage";
import { MomentsYouLike } from "@view/MomentsYouLike";
import { LanePage } from "@view/LanePage";
import { HomePage } from "@view/HomePage";
import { TokenPage } from "@view/TokenPage";
import { useAppDispatch } from "@store/hooks";
import { useEffect } from "react";
import { getConfig } from "@store/slice/config/configSlice";

export function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getConfig());
  }, []);

  return (
    <BrowserRouter>
      <RootWrapper>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/token" element={<TokenPage />} />
        <Route path="/buy" element={<BuyPage />} />
        <Route path="/thanks" element={<ThankYouPaymentPage />} />
        <Route path="/lane" element={<LanePage />} />
        <Route path="/qrcode" element={<QrCodePage />} />
        <Route path="/moments" element={<MomentsYouLike />} />
      </Routes>
      </RootWrapper>
    </BrowserRouter>
  );
}

function RootWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isThankYouPage = location.pathname === "/thanks";

  useEffect(() => {
    const rootElement = document.documentElement;
    if (isThankYouPage) {
      rootElement.classList.add("thank-you-page");
    } else {
      rootElement.classList.remove("thank-you-page");
    }
  }, [isThankYouPage]);

  return <>{children}</>;
}
