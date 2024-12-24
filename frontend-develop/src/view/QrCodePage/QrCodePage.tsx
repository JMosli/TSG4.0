import "@view/QrCodePage/QrCodePage.css";
import logo from "@assets/lane-logo.png";
import { useEffect, useState } from "react";

export const QrCodePage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState("fade-in");

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFade("fade-out");

      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % qrcodeMockData.length);
        setFade("fade-in");
      }, 1000);
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  const currentSnippet = qrcodeMockData[currentIndex];

  return (
    <div
      className={`qr-code-wrapper ${fade}`}
      style={{ backgroundImage: `url(${currentSnippet.image})` }}
    >
      <div className="qr-code-info">
        <div className="qr-code-info-header">
          <span>To purchase this media, scan the QR-code</span>
        </div>
        <div className="qr-code-info-footer">
          <img className="qr-code-info-footer-image" src={logo} alt="" />
          <div className="qr-code-content">
            <span className="qr-code-text">Snippet #0{currentSnippet.id}</span>
            <img className="qr-code-image" src={currentSnippet.qrCode} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};
