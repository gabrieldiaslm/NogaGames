import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { AuthUser, CompletedGameItem, GroupSummary } from "../api/types";
import { GameCover } from "../components/GameCover";
import { LogoutIcon, PlayIcon, RefreshIcon, XIcon } from "../components/Icons";
import { ReviewModal } from "../components/ReviewModal";
import { formatHours } from "../utils/format";

interface PlayingGame extends CompletedGameItem {
  groupId: string;
}

export function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState<PlayingGame[]>([]);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<PlayingGame | null>(null);

  const loadPlaying = useCallback(async () => {
    try {
      const { data } = await api.get<PlayingGame[]>("/games/playing");
      setPlaying(data);
      const { data: groupsData } = await api.get<GroupSummary[]>("/groups");
      setGroups(groupsData);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaying();
  }, [loadPlaying]);

  function groupName(groupId: string): string | null {
    return groups.find((group) => group.id === groupId)?.name ?? null;
  }

  async function changeStatus(game: PlayingGame, status: "COMPLETED" | "BACKLOG" | "DROPPED") {
    setBusyId(game.id);
    setMessage(null);
    try {
      await api.patch(`/games/${game.id}/status`, { status });
      const texts: Record<string, string> = {
        COMPLETED: `${game.title} zerado!`,
        BACKLOG: `${game.title} voltou ao backlog.`,
        DROPPED: `${game.title} marcado como abandonado.`,
      };
      setMessage({ type: "ok", text: texts[status] });
      await loadPlaying();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const { data } = await api.patch<AuthUser>("/profile", {
        username: username.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      updateUser(data);
      setEditing(false);
      setMessage({ type: "ok", text: "Perfil atualizado!" });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/auth/login");
  }

  return (
    <main className="page">
      <h1>Perfil</h1>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      <section className="profile-card" aria-label="Dados do usuário">
        {user?.avatarUrl ? (
          <img className="avatar profile" src={user.avatarUrl} alt="" />
        ) : (
          <div className="profile-avatar" aria-hidden="true">
            {user?.username?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <strong className="profile-username">{user?.username}</strong>
          <span className="muted">{user?.email}</span>
        </div>
        <button
          className="btn small"
          onClick={() => {
            setEditing((prev) => !prev);
            setUsername(user?.username ?? "");
            setAvatarUrl(user?.avatarUrl ?? "");
          }}
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </section>

      {editing && (
        <form className="stack-form" onSubmit={handleSaveProfile}>
          <input
            type="text"
            placeholder="Nome de usuário"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            aria-label="Nome de usuário"
            required
          />
          <input
            type="url"
            placeholder="URL do avatar (opcional)"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            aria-label="URL do avatar"
          />
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}

      <section aria-label="Jogando agora">
        <h2 className="section-title">Jogando agora</h2>
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : playing.length === 0 ? (
          <div className="empty-state">
            <p>Nada em andamento.</p>
            <p className="muted">Escolha o próximo jogo no Dashboard para começar.</p>
          </div>
        ) : (
          <ul className="game-list">
            {playing.map((game) => (
              <li key={game.id} className="game-row">
                <GameCover src={game.coverImage} alt={game.title} className="thumb" />
                <div className="game-row-info">
                  <strong>{game.title}</strong>
                  <span className="muted">
                    {groupName(game.groupId) ? `${groupName(game.groupId)} · ` : ""}
                    Jogando desde {new Date(game.updatedAt).toLocaleDateString("pt-BR")}
                    {formatHours(game.hoursToBeat)
                      ? ` \u00b7 ${formatHours(game.hoursToBeat)}`
                      : ""}
                  </span>
                </div>
                <button
                  className="btn icon"
                  onClick={() => setReviewTarget(game)}
                  disabled={busyId === game.id}
                  aria-label={`Marcar ${game.title} como zerado`}
                >
                  <PlayIcon />
                </button>
                <button
                  className="btn icon"
                  onClick={() => changeStatus(game, "BACKLOG")}
                  disabled={busyId === game.id}
                  aria-label={`Devolver ${game.title} ao backlog`}
                >
                  <RefreshIcon />
                </button>
                <button
                  className="btn icon danger-icon"
                  onClick={() => changeStatus(game, "DROPPED")}
                  disabled={busyId === game.id}
                  aria-label={`Desistir de ${game.title}`}
                >
                  <XIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button className="btn danger full" onClick={handleLogout}>
        <LogoutIcon />
        Sair da conta
      </button>

      {reviewTarget && (
        <ReviewModal
          game={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSaved={loadPlaying}
          onMessage={setMessage}
        />
      )}
    </main>
  );
}