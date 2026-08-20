import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import type { GroupSummary } from "../api/types";
import { PlusIcon, UsersIcon } from "../components/Icons";

export function GroupsPage() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [joinGroupId, setJoinGroupId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

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

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setCreating(true);
    try {
      const { data } = await api.post<GroupSummary>("/groups", { name, description });
      setGroups((prev) => [data, ...prev]);
      setName("");
      setDescription("");
      setMessage({ type: "ok", text: "Grupo criado! Compartilhe o código de convite com os amigos." });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setJoining(true);
    try {
      const { data } = await api.post<GroupSummary>(`/groups/${joinGroupId}/join`, { inviteCode });
      setGroups((prev) => [data, ...prev]);
      setJoinGroupId("");
      setInviteCode("");
      setMessage({ type: "ok", text: `Você entrou no grupo "${data.name}"!` });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="page">
      <h1>Meus grupos</h1>
      <p className="page-subtitle">Crie um grupo com seus amigos e decidam o próximo jogo juntos.</p>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      <section aria-label="Criar grupo">
        <h2 className="section-title">Criar grupo</h2>
        <form className="stack-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Nome do grupo (ex: Jogadores Noturnos)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="Nome do grupo"
            required
          />
          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-label="Descrição do grupo"
          />
          <button className="btn primary" type="submit" disabled={creating}>
            <PlusIcon /> {creating ? "Criando..." : "Criar grupo"}
          </button>
        </form>
      </section>

      <section aria-label="Entrar em grupo">
        <h2 className="section-title">Entrar com código</h2>
        <form className="stack-form" onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="ID do grupo (do convite)"
            value={joinGroupId}
            onChange={(event) => setJoinGroupId(event.target.value)}
            aria-label="ID do grupo"
            required
          />
          <input
            type="text"
            placeholder="Código de convite"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            aria-label="Código de convite"
            required
          />
          <button className="btn" type="submit" disabled={joining}>
            {joining ? "Entrando..." : "Entrar no grupo"}
          </button>
        </form>
      </section>

      <section aria-label="Meus grupos">
        <h2 className="section-title">Minhas turmas</h2>
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <p>Você ainda não participa de nenhum grupo.</p>
            <p className="muted">Crie um grupo acima ou entre com um código de convite.</p>
          </div>
        ) : (
          <ul className="game-list">
            {groups.map((group) => (
              <li key={group.id}>
                <Link className="group-card" to={`/groups/${group.id}`}>
                  <div className="group-card-info">
                    <strong>{group.name}</strong>
                    {group.description && <span className="muted">{group.description}</span>}
                    <span className="muted">
                      {group.memberCount} membro{group.memberCount === 1 ? "" : "s"} · {group.gameCount} jogo
                      {group.gameCount === 1 ? "" : "s"} ·{" "}
                      {group.myRole === "ADMIN" ? "Admin" : "Membro"}
                    </span>
                  </div>
                  <UsersIcon />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}