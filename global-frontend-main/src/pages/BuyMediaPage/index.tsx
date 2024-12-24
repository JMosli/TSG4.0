import { useSearchParams } from "react-router-dom";
import useGlobalApi from "../../utils/hooks/useGlobalApi";
import { FormEvent } from "react";

export default function BuyMediaPage() {
  const api = useGlobalApi();
  const [params, _] = useSearchParams();
  if (!params.has("t")) return <>Error</>;

  const handleContinue = async (event: FormEvent) => {
    event.preventDefault();

    const token = params.get("t");
    if (!token) return;

    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const consent = formData.get("agree") as string;

    if (!email || consent !== "on") return;

    const response = await api.payment.buyMedia({
      email,
      token,
    });
    const [data, error] = response.transpose();
    if (error) return;

    setTimeout(() => {
      window.open(data.link.url, "_blank");
    });
  };

  return (
    <main className="flex flex-row justify-center items-center h-full">
      <form
        className="flex flex-col items-center gap-2"
        onSubmit={handleContinue}
      >
        <input
          className="p-2 outline-none border border-neutral-500 rounded-lg"
          placeholder="Email"
          name="email"
        />
        <label className="flex flex-row gap-3">
          Do you consent to TSG using your media?
          <input type="checkbox" name="agree" defaultChecked />
        </label>
        <button>Continue</button>
      </form>
    </main>
  );
}
