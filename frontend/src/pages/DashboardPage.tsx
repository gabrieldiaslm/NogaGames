import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import type { DashboardGame, GameSearchResult, RandomGame } from "../api/types";
import { GameCover } from "../components/GameCover";
import { PlusIcon, SearchIcon } from "../components/Icons";
import { formatHours } from "../utils/format";

export function DashboardPage() {
  const { groupId = "" } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [winner, setWinner] = useState<DashboardGame | null>(null);
  const [surprise, setSurprise] = useState<RandomGame | null>(null);
  const [surpriseEmpty, setSurpriseEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [surprising, setSurprising] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const loadWinner = useCallback(async () => {
    try {
      const { data } = await api.get<DashboardGame | null>(`/groups/${groupId}/dashboard`);
      setWinner(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }, [groupId]);

  useEffect(() => {
    loadWinner().finally(() => setLoading(false));
  }, [loadWinner]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setSearching(true);
    setMessage(null);
    try {
      const { data } = await api.get<GameSearchResult[]>("/games/search", {
        params: { q: term },
      });
      setResults(data);
      if (data.length === 0) {
        setMessage({ type: "ok", text: "Nenhum jogo encontrado para esta busca." });
      }
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(externalId: number) {
    setAddingId(externalId);
    setMessage(null);
    try {
      await api.post("/games", { externalId, groupId });
      setResults((prev) => prev.filter((game) => game.externalId !== externalId));
      setMessage({ type: "ok", text: "Jogo adicionado ao backlog!" });
      await loadWinner();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setAddingId(null);
    }
  }

  async function handleStartPlaying() {
    if (!winner) return;
    setMessage(null);
    try {
      await api.patch(`/games/${winner.id}/status`, { status: "PLAYING" });
      setMessage({ type: "ok", text: "Boa jogatina!" });
      setWinner(null);
      await loadWinner();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  async function handleSurprise() {
    setMessage(null);
    setSurprising(true);
    try {
      const { data } = await api.get<RandomGame | null>(`/groups/${groupId}/random`);
      setSurprise(data);
      setSurpriseEmpty(data === null);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setSurprising(false);
    }
  }

  return (
    <main className="page">
      <h1>Dashboard</h1>
      <p className="page-subtitle">O próximo jogo da galera.</p>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      <form className="search-bar" onSubmit={handleSearch} role="search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Buscar jogo na RAWG..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar jogo"
        />
        <button className="btn primary" type="submit" disabled={searching}>
          {searching ? "..." : "Buscar"}
        </button>
      </form>

      {results.length > 0 && (
        <section aria-label="Resultados da busca">
          <h2 className="section-title">Resultados</h2>
          <ul className="game-list">
            {results.map((game) => (
              <li key={game.externalId} className="game-row">
                <GameCover src={game.coverImage} alt={game.title} className="thumb" />
                <div className="game-row-info">
                  <strong>{game.title}</strong>
                  <span className="muted">
                    {game.releaseYear ?? "Ano desconhecido"}
                    {game.genre ? ` \u00b7 ${game.genre}` : ""}
                    {formatHours(game.hoursToBeat) ? ` \u00b7 ${formatHours(game.hoursToBeat)}` : ""}
                  </span>
                </div>
                <button
                  className="btn icon"
                  onClick={() => handleAdd(game.externalId)}
                  disabled={addingId === game.externalId}
                  aria-label={`Adicionar ${game.title} ao backlog`}
                >
                  <PlusIcon />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="winner-section" aria-label="Próximo jogo">
        <div className="section-head-row">
          <h2 className="section-title">Próximo jogo</h2>
          <button
            className="btn surprise-btn"
            onClick={handleSurprise}
            disabled={surprising}
            aria-label="Sortear um jogo surpresa"
          >
            {surprising ? "..." : "\uD83C\uDFB2 Surpresa!"}
          </button>
        </div>
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : winner ? (
          <div className="winner-card">
            <GameCover src={winner.coverImage} alt={winner.title} className="winner-cover" />
            <div className="winner-info">
              <h3>{winner.title}</h3>
              <p className="votes-badge">
                {winner.votesCount} {winner.votesCount === 1 ? "voto" : "votos"}
                {winner.releaseYear ? ` \u00b7 ${winner.releaseYear}` : ""}
                {winner.genre ? ` \u00b7 ${winner.genre}` : ""}
                {formatHours(winner.hoursToBeat) ? ` \u00b7 ${formatHours(winner.hoursToBeat)}` : ""}
              </p>
              <button className="btn primary" onClick={handleStartPlaying}>
                Começar a jogar
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhum jogo no backlog agora.</p>
            <p className="muted">Busque um jogo acima e adicione à lista para começar a votação.</p>
          </div>
        )}
      </section>

      <section aria-label="Surpresa">
        <h2 className="section-title">🎲 Surpresa</h2>
        {surpriseEmpty ? (
          <div className="empty-state">
            <p>Adicione jogos ao backlog para usar a Surpresa!</p>
          </div>
        ) : surprise ? (
          <div className="surprise-card">
            <GameCover src={surprise.coverImage} alt={surprise.title} className="winner-cover" />
            <div className="winner-info">
              <h3>{surprise.title}</h3>
              <p className="muted">
                🎲 Surpresa! O que acha de jogar isso?
              </p>
              <p className="votes-badge">
                {surprise.releaseYear ?? "Ano desconhecido"}
                {surprise.genre ? ` \u00b7 ${surprise.genre}` : ""}
                {formatHours(surprise.hoursToBeat) ? ` \u00b7 ${formatHours(surprise.hoursToBeat)}` : ""}
              </p>
              <div className="modal-actions">
                <button className="btn" onClick={handleSurprise} disabled={surprising}>
                  Outra Surpresa!
                </button>
                <button
                  className="btn primary"
                  onClick={() => navigate(`/groups/${groupId}/backlog`)}
                >
                  Quero este!
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="muted">Clique em "🎲 Surpresa!" para sortear um jogo do backlog.</p>
        )}
      </section>
    </main>
  );
}