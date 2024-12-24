import { Link, useParams } from "react-router-dom";
import styles from "./Header.module.css";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import useUserPermissions from "@utils/hooks/useUserPermissions";
import { useEffect } from "react";
import { loadRange } from "@store/slice/range/rangeSlice";

const headerRoutes = [
  { name: "Main", route: "", admin: true },
  { name: "Camera", route: "camera" },
  { name: "Kiosk", route: "kiosk", admin: true },
  { name: "Configuration", route: "configuration", admin: true },
];

export const Header = ({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}) => {
  const { rangeId } = useParams<{ rangeId: string }>();
  const perms = useUserPermissions();
  const { range } = useAppSelector((state) => state.range);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (range || !rangeId) return;

    dispatch(loadRange(+rangeId));
  }, []);

  return (
    <div className={styles.headerWrapper}>
      <div className={styles.header}>
        {headerRoutes.map((header) => {
          return !perms?.includes("owner") && header.admin ? null : (
            <div className={styles.headerSelect}>
              <span
                className={styles.headerSelectLink}
                onClick={() => onNavigate(header.route)}
              >
                {header.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
