import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { GroupSummary } from "../api/types";
import { PlusIcon, UsersIcon } from "../components/Icons";

export function HomePage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      const { data } = await api.get<GroupSummary[]>("/groups");
      setGroups(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return (
    <main className="page">
      <section className="home-hero">
        <h1>E aí, {user?.username}?</h1>
        <p className="page-subtitle">Suas turmas estão prontas para a próxima jogatina.</p>
      </section>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      <section aria-label="Minhas turmas">
        <h2 className="section-title">Minhas turmas</h2>
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <p>Você ainda não está em nenhuma turma.</p>
            <p className="muted">
              Crie uma turma ou entre com um convite na aba Conexão.
            </p>
            <Link className="btn primary" to="/conexao">
              <PlusIcon /> Criar ou entrar
            </Link>
          </div>
        ) : (
          <ul className="game-list">
            {groups.map((group) => (
              <li key={group.id}>
                <Link className="turma-card" to={`/groups/${group.id}`}>
                  <span className="turma-avatar" aria-hidden="true">
                    {group.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="turma-info">
                    <strong>{group.name}</strong>
                    {group.description && <span className="muted">{group.description}</span>}
                    <span className="muted">
                      <UsersIcon size={14} /> {group.memberCount} membro{group.memberCount === 1 ? "" : "s"} ·{" "}
                      {group.gameCount} jogo{group.gameCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span className={`role-badge ${group.myRole === "ADMIN" ? "admin" : ""}`}>
                    {group.myRole === "ADMIN" ? "Admin" : "Membro"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}