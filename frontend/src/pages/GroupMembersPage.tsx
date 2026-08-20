import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import type { GroupMemberItem, GroupSummary } from "../api/types";
import { CopyIcon, LogoutIcon, UsersIcon } from "../components/Icons";

export function GroupMembersPage() {
  const { groupId = "" } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState<GroupMemberItem[]>([]);
  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ data: membersData }, { data: groupData }] = await Promise.all([
        api.get<GroupMemberItem[]>(`/groups/${groupId}/members`),
        api.get<GroupSummary>(`/groups/${groupId}`),
      ]);
      setMembers(membersData);
      setGroup(groupData);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCopyInvite() {
    if (!group) return;
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setMessage({ type: "ok", text: "Código de convite copiado!" });
    } catch {
      setMessage({ type: "error", text: "Não foi possível copiar o código." });
    }
  }

  async function handleRemove(memberId: string, username: string) {
    setRemovingId(memberId);
    setMessage(null);
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      setMessage({ type: "ok", text: `${username} removido do grupo.` });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setRemovingId(null);
    }
  }

  async function handleDeleteGroup() {
    if (!group) return;
    const confirmed = window.confirm(
      `Excluir a turma "${group.name}"? Todos os jogos, votos e avaliações serão apagados. Essa ação não pode ser desfeita.`,
    );
    if (!confirmed) return;
    setDeleting(true);
    setMessage(null);
    try {
      await api.delete(`/groups/${groupId}`);
      navigate("/");
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
      setDeleting(false);
    }
  }

  const isAdmin = group?.myRole === "ADMIN";

  return (
    <main className="page">
      <h1>Membros</h1>
      <p className="page-subtitle">A galera do grupo.</p>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      {group && (
        <section className="invite-card" aria-label="Convite">
          <div className="invite-info">
            <strong>Convite do grupo</strong>
            <span className="muted">Quem tiver o código pode entrar.</span>
          </div>
          <code className="invite-code">{group.inviteCode}</code>
          <button className="btn" onClick={handleCopyInvite} aria-label="Copiar código de convite">
            <CopyIcon /> Copiar
          </button>
        </section>
      )}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : (
        <ul className="game-list">
          {members.map((member) => (
            <li key={member.id} className="game-row">
              {member.avatarUrl ? (
                <img className="avatar" src={member.avatarUrl} alt="" />
              ) : (
                <span className="profile-avatar small" aria-hidden="true">
                  {member.username.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="game-row-info">
                <strong>{member.username}</strong>
                <span className="muted">{member.role === "ADMIN" ? "Admin" : "Membro"}</span>
              </div>
              {isAdmin && member.role !== "ADMIN" && (
                <button
                  className="btn icon danger-icon"
                  onClick={() => handleRemove(member.id, member.username)}
                  disabled={removingId === member.id}
                  aria-label={`Remover ${member.username} do grupo`}
                >
                  <LogoutIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isAdmin && (
        <section aria-label="Zona de risco">
          <h2 className="section-title">Zona de risco</h2>
          <button className="btn danger full" onClick={handleDeleteGroup} disabled={deleting}>
            <UsersIcon />
            {deleting ? "Excluindo..." : "Excluir turma"}
          </button>
        </section>
      )}
    </main>
  );
}