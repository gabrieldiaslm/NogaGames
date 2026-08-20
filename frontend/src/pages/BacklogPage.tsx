import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getErrorMessage } from "../api/client";
import type { BacklogGameItem, GroupFilters } from "../api/types";
import { FilterSheet, type ActiveFilters } from "../components/FilterSheet";
import { GameDetailModal, type ModalGame } from "../components/GameDetailModal";
import { GameCover } from "../components/GameCover";
import { formatHours } from "../utils/format";

const EMPTY_FILTERS: ActiveFilters = { genre: "", year: "", platform: "" };

function filtersToParams(filters: ActiveFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.genre) params.genre = filters.genre;
  if (filters.year) params.year = filters.year;
  if (filters.platform) params.platform = filters.platform;
  return params;
}

export function BacklogPage() {
  const { groupId = "" } = useParams();
  const [games, setGames] = useState<BacklogGameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [selected, setSelected] = useState<ModalGame | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<GroupFilters>({ genres: [], years: [], platforms: [] });
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

  const hasActiveFilters = appliedFilters.genre !== "" || appliedFilters.year !== "" || appliedFilters.platform !== "";

  const loadBacklog = useCallback(async () => {
    try {
      const { data } = await api.get<BacklogGameItem[]>(`/groups/${groupId}/backlog`, {
        params: filtersToParams(appliedFilters),
      });
      setGames(data);
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, [groupId, appliedFilters]);

  useEffect(() => {
    loadBacklog();
  }, [loadBacklog]);

  useEffect(() => {
    api
      .get<GroupFilters>(`/groups/${groupId}/filters`)
      .then(({ data }) => setFilterOptions(data))
      .catch(() => undefined);
  }, [groupId]);

  async function startPlaying(game: ModalGame) {
    setMessage(null);
    try {
      await api.patch(`/games/${game.id}/status`, { status: "PLAYING" });
      setMessage({ type: "ok", text: `${game.title} movido para "jogando".` });
      setSelected(null);
      await loadBacklog();
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    }
  }

  function handleApply() {
    setAppliedFilters(activeFilters);
    setFilterOpen(false);
  }

  function handleClear() {
    setActiveFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setFilterOpen(false);
  }

  return (
    <main className="page">
      <div className="page-head-row">
        <div>
          <h1>Backlog</h1>
          <p className="page-subtitle">Vote no próximo jogo para zerar.</p>
        </div>
        <button
          className={`btn filter-btn${hasActiveFilters ? " active" : ""}`}
          onClick={() => setFilterOpen(true)}
          aria-label="Abrir filtros"
        >
          🔍 Filtrar
          {hasActiveFilters ? ` (${[appliedFilters.genre, appliedFilters.year, appliedFilters.platform].filter(Boolean).length})` : ""}
        </button>
      </div>

      {message && <div className={`banner ${message.type}`}>{message.text}</div>}

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : games.length === 0 ? (
        <div className="empty-state">
          <p>{hasActiveFilters ? "Nenhum jogo encontrado com esses filtros" : "Backlog vazio."}</p>
          <p className="muted">
            {hasActiveFilters
              ? "Ajuste ou limpe os filtros para ver mais jogos."
              : "Adicione jogos pela busca no Dashboard para começar a votação."}
          </p>
          {hasActiveFilters && (
            <button className="btn" onClick={handleClear}>
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <ul className="game-list">
          {games.map((game) => (
            <li key={game.id} className="game-row">
              <GameCover src={game.coverImage} alt={game.title} className="thumb" />
              <div className="game-row-info">
                <strong>{game.title}</strong>
                <span className="muted">
                  {game.votesCount} {game.votesCount === 1 ? "voto" : "votos"}
                  {formatHours(game.hoursToBeat)
                    ? ` \u00b7 ${formatHours(game.hoursToBeat)}`
                    : ""}
                </span>
              </div>
              <button
                className="btn icon detail"
                onClick={() =>
                  setSelected({
                    id: game.id,
                    title: game.title,
                    coverImage: game.coverImage,
                    votesCount: game.votesCount,
                    userVoted: game.userVoted,
                    hoursToBeat: game.hoursToBeat,
                  })
                }
                aria-label={`Ver detalhes de ${game.title}`}
              >
                {game.userVoted ? "\u2764" : "\u2192"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <GameDetailModal
          game={selected}
          onClose={() => setSelected(null)}
          onChanged={loadBacklog}
          onStartPlaying={startPlaying}
          onShowMessage={setMessage}
        />
      )}

      <FilterSheet
        open={filterOpen}
        options={filterOptions}
        active={activeFilters}
        onChange={setActiveFilters}
        onApply={handleApply}
        onClear={handleClear}
        onClose={() => setFilterOpen(false)}
      />
    </main>
  );
}