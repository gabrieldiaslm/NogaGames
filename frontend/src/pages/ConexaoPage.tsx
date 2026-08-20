import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, getErrorMessage } from "../api/client";
import type { GroupSummary } from "../api/types";
import { CopyIcon, PlusIcon } from "../components/Icons";

export function ConexaoPage() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      const { data } = await api.get<GroupSummary[]>("/groups");
      setGroups(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
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
      setMessage({
        type: "ok",
        text: `Turma "${data.name}" criada! Compartilhe o código de convite com os amigos.`,
      });
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
      const { data } = await api.post<GroupSummary>("/groups/join", { inviteCode });
      setGroups((prev) => [data, ...prev]);
      setInviteCode("");
      setMessage({ type: "ok", text: `Você entrou na turma "${data.name}"!` });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setJoining(false);
    }
  }

  async function handleCopyInvite(group: GroupSummary) {
    try {
      await navigator.clipboard.writeText(`NogaGames - turma "${group.name}"\nConvite: ${group.inviteCode}`);
      setCopiedId(group.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setMessage({ type: "error", text: "Não foi possível copiar o convite." });
    }
  }

  return (
    <main className="page">
      <h1>Conexão</h1>
      <p className="page-subtitle">Crie uma turma nova ou entre em uma existente.</p>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      <section aria-label="Criar turma">
        <h2 className="section-title">Criar turma</h2>
        <form className="stack-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Nome da turma (ex: Jogadores Noturnos)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="Nome da turma"
            required
          />
          <input
            type="text"
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            aria-label="Descrição da turma"
          />
          <button className="btn primary" type="submit" disabled={creating}>
            <PlusIcon /> {creating ? "Criando..." : "Criar turma"}
          </button>
        </form>
      </section>

      <section aria-label="Entrar com convite">
        <h2 className="section-title">Entrar com convite</h2>
        <form className="stack-form" onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Código de convite"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            aria-label="Código de convite"
            required
          />
          <button className="btn" type="submit" disabled={joining}>
            {joining ? "Entrando..." : "Entrar na turma"}
          </button>
        </form>
      </section>

      {groups.length > 0 && (
        <section aria-label="Meus convites">
          <h2 className="section-title">Meus convites</h2>
          <p className="muted invite-hint">
            Copie o convite das suas turmas e envie para os amigos.
          </p>
          <ul className="game-list">
            {groups.map((group) => (
              <li key={group.id} className="game-row">
                <div className="game-row-info">
                  <strong>{group.name}</strong>
                  <code className="invite-code compact">{group.inviteCode}</code>
                </div>
                <button
                  className="btn icon"
                  onClick={() => handleCopyInvite(group)}
                  aria-label={`Copiar convite de ${group.name}`}
                >
                  <CopyIcon />
                  {copiedId === group.id ? (
                    <span className="copied-tick" aria-hidden="true">
                      ok
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}