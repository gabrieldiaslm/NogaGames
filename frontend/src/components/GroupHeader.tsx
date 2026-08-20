import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { GroupSummary } from "../api/types";
import { UsersIcon } from "./Icons";

export function GroupHeader({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<GroupSummary | null>(null);

  useEffect(() => {
    api.get<GroupSummary>(`/groups/${groupId}`).then(({ data }) => setGroup(data)).catch(() => setGroup(null));
  }, [groupId]);

  if (!group) {
    return (
      <header className="group-header">
        <Link to="/" className="group-back-link">
          Início
        </Link>
      </header>
    );
  }

  return (
    <header className="group-header">
      <Link to="/" className="group-back-link" aria-label="Voltar para o início">
        &larr;
      </Link>
      <div className="group-header-info">
        <strong>{group.name}</strong>
        <span className="muted">
          <UsersIcon size={14} /> {group.memberCount} membro{group.memberCount === 1 ? "" : "s"}
        </span>
      </div>
    </header>
  );
}