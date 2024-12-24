import useGlobalApi from "@utils/hooks/useGlobalApi";
import { useEffect, useState } from "react";
import { ObjectToCamel } from "ts-case-convert/lib/caseConvert";
import { Paginated } from "frontend-sdk/dist/types";
import { ButtonLoading } from "@component";
import { User } from "frontend-sdk/dist/global/auth/types";
import { PaginationControl } from "@component/Pagination";
import CreateUserModal from "@component/Modal/CreateUserModal";
import { Link, useNavigate } from "react-router-dom";
import UsersTable from "@component/Table/UsersTable";

export default function UsersPage() {
  const globalApi = useGlobalApi();
  const navigate = useNavigate();

  const [users, setUsers] = useState<ObjectToCamel<Paginated<User>> | null>(
    null
  );
  const [creating, setCreating] = useState(false);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState("");

  const loadUsers = () =>
    globalApi.users
      .list({ take: 50, skip })
      .then((res) => res.transpose())
      .then(([users, error]) =>
        users ? setUsers(users) : setError(error.message as string)
      );

  useEffect(() => {
    loadUsers();
  }, [skip]);

  if (error || !users) return <>{error}</>;

  return (
    <main>
      <h3>
        Users list (<Link to="/">back</Link>)
      </h3>
      {creating && (
        <CreateUserModal toggle={() => setCreating(false)} reload={loadUsers} />
      )}
      <div className="flex flex-col gap-6 mt-6 items-center">
        <button onClick={() => setCreating(true)}>Create new user</button>
        <UsersTable
          users={users.items}
          select={(id) => navigate(`/user/${id}`)}
        />
        <PaginationControl
          onPageChange={setSkip}
          maxPage={Math.ceil(users.count / 50)}
          startPage={0}
          take={50}
        />
      </div>
    </main>
  );
}
