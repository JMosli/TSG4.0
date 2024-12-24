import styles from "@view/TokenPage/TokenPage.module.css";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { putToken } from "@store/slice/auth/authSlice";

export const TokenPage = () => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((store) => store.auth);

  return (
    <div className={styles.tokenPage}>
      <input
        type="text"
        className={styles.input}
        placeholder="Enter token"
        value={token}
        onChange={(event) => dispatch(putToken(event.currentTarget.value))}
      />
    </div>
  );
};
