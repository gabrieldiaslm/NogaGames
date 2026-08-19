import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, getErrorMessage } from "../api/client";
import type { DashboardGame, GameSearchResult } from "../api/types";
import { GameCover } from "../components/GameCover";
import { PlusIcon, SearchIcon } from "../components/Icons";
import { formatHours } from "../utils/format";

export function DashboardPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [winner, setWinner] = useState<DashboardGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const loadWinner = useCallback(async () => {
    try {
      const { data } = await api.get<DashboardGame | null>("/games/dashboard");
      setWinner(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }, []);

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
      await api.post("/games", { externalId });
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
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
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
                    {formatHours(game.hoursToBeat)
                      ? ` \u00b7 ${formatHours(game.hoursToBeat)}`
                      : ""}
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
        <h2 className="section-title">Próximo jogo</h2>
        {loading ? (
          <p className="muted">Carregando...</p>
        ) : winner ? (
          <div className="winner-card">
            <GameCover src={winner.coverImage} alt={winner.title} className="winner-cover" />
            <div className="winner-info">
              <h3>{winner.title}</h3>
              <p className="votes-badge">
                {winner.votesCount} {winner.votesCount === 1 ? "voto" : "votos"}
                {formatHours(winner.hoursToBeat)
                  ? ` \u00b7 ${formatHours(winner.hoursToBeat)}`
                  : ""}
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
    </main>
  );
}