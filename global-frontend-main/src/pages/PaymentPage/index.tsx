import { useParams } from "react-router-dom";
import useGlobalApi from "../../utils/hooks/useGlobalApi";
import { useEffect, useState } from "react";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import { RetrievePaymentResponse } from "frontend-sdk/dist/global/payment/types";
import Video from "../../components/Video";

export default function PaymentPage() {
  const { uid } = useParams<{ uid: string }>();
  if (!uid) return <>Error</>;

  const api = useGlobalApi();

  const [error, setError] = useState("");
  const [payment, setPayment] =
    useState<ObjectToCamel<RetrievePaymentResponse> | null>(null);

  useEffect(() => {
    api.payment
      .retrieve(uid)
      .then((res) => res.transpose())
      .then(([payment, error]) =>
        payment ? setPayment(payment) : setError(error.message as string)
      );
  }, []);

  if (error) return <>{error}</>;
  if (!payment) return <>Loading...</>;

  if (!payment.video)
    return (
      <main className="flex flex-col items-center justify-center w-full h-full gap-3">
        <h2>You videos are not ready, or payment is not completed</h2>
        <h3>Reload the page later or when the payment is completed</h3>
      </main>
    );

  return (
    <main className="flex flex-col gap-3 p-6">
      <h3>Your media</h3>
      <div className="flex flex-row gap-3 flex-wrap">
        {payment.video.map((video) => (
          <Video
            src={`${import.meta.env.VITE_BACKEND_URL}/video/${video.uid}/video`}
          />
        ))}
        {payment.photo.map((p) => (
          <img
            src={`${import.meta.env.VITE_BACKEND_URL}/photo/${p.uid}/photo`}
            className="w-64"
          />
        ))}
      </div>
    </main>
  );
}
