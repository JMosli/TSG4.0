import { useAppSelector } from "@store/hooks";
import { Link } from "react-router-dom";

const links = [
  { name: "Users", route: "user" },
  { name: "Statistics", route: "range/stats", globalAdmin: true },
];

export default function NavigationLinks() {
  const me = useAppSelector((state) => state.api.user);
  return (
    <div className="flex flex-row justify-evenly w-full">
      {links.map((link) =>
        !me?.isGlobalAdmin && link.globalAdmin ? null : (
          <Link to={link.route}>{link.name}</Link>
        )
      )}
    </div>
  );
}
