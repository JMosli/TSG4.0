import { ButtonLoading } from "@component";
import { globalApi } from "@store/api";
import { useAppDispatch } from "@store/hooks";
import { getUser, setToken } from "@store/slice/globalApi/apiSlice";
import { wait } from "@utils/utils";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const login = formData.get("login") as string;
    const password = formData.get("password") as string;
    if (!login || !password) return setError("Login or password is empty");

    const response = await globalApi.auth.login({
      password,
      username: login,
    });
    const [auth, error] = response.transpose();

    if (error)
      return setError(
        `Could not sign in: wrong username or password (${error.message})`
      );

    localStorage.setItem("auth_token", auth.accessToken);

    dispatch(setToken(auth.accessToken));
    await dispatch(getUser({}));

    navigate(`/`);
  };

  return (
    <div className="w-full flex flex-col gap-6 justify-center items-center h-[100vh]">
      <h3>Admin Login</h3>
      <form className="flex flex-col gap-2 items-center" onSubmit={handleLogin}>
        <input
          placeholder="Login"
          className="p-2 border-gray-600 border rounded-md outline-none w-full"
          name="login"
        />
        <input
          placeholder="Password"
          className="p-2 border-gray-600 border rounded-md outline-none w-full"
          name="password"
        />
        <b className="text-red-600">{error}</b>
        <ButtonLoading className="w-full" onTap={() => wait(10 * 1000)}>
          Login
        </ButtonLoading>
      </form>
    </div>
  );
}
