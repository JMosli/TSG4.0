import { useAppDispatch, useAppSelector } from "@store/hooks";

export default function useUserPermissions(): Array<
  "all" | "owner" | "sg" | "none"
> | null {
  const me = useAppSelector((state) => state.api.user);
  const { range } = useAppSelector((state) => state.range);

  if (!range) return null;

  if (me?.isGlobalAdmin) return ["all", "owner", "sg"];
  if (range.owners.some((o) => o.id === me?.id)) return ["owner", "sg"];
  if (range.securityGuards.some((s) => s.id === me?.id)) return ["sg"];
  else return ["none"];
}
