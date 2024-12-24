import { User } from "frontend-sdk/dist/global/auth/types";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";

export default function UsersTable({
  users,
  select,
}: {
  users: ObjectToCamel<{ id: number; email: string; username: string }>[];
  select: (id: number) => void;
}) {
  return (
    <table className="w-full h-fit">
      <thead>
        <tr>
          <th>Id</th>
          <th>Username</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            className="hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => select(user.id)}
            key={user.id}
          >
            <td>{user.id}</td>
            <td>{user.username}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
