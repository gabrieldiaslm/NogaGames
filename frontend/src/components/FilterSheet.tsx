import type { GroupFilters } from "../api/types";
import { XIcon } from "./Icons";

export interface ActiveFilters {
  genre: string;
  year: string;
  platform: string;
}

interface FilterSheetProps {
  open: boolean;
  options: GroupFilters;
  active: ActiveFilters;
  onChange: (filters: ActiveFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

export function FilterSheet({ open, options, active, onChange, onApply, onClear, onClose }: FilterSheetProps) {
  if (!open) return null;

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Filtros" onClick={onClose}>
      <div className="sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <h2>Filtrar</h2>
          <button className="btn icon" onClick={onClose} aria-label="Fechar filtros">
            <XIcon />
          </button>
        </div>

        <label className="sheet-field">
          <span>Gênero</span>
          <select value={active.genre} onChange={(event) => onChange({ ...active, genre: event.target.value })} aria-label="Gênero">
            <option value="">Todos</option>
            {options.genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>

        <label className="sheet-field">
          <span>Ano</span>
          <select value={active.year} onChange={(event) => onChange({ ...active, year: event.target.value })} aria-label="Ano">
            <option value="">Todos</option>
            {options.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="sheet-field">
          <span>Plataforma</span>
          <select value={active.platform} onChange={(event) => onChange({ ...active, platform: event.target.value })} aria-label="Plataforma">
            <option value="">Todas</option>
            {options.platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>

        <div className="sheet-actions">
          <button className="btn" onClick={onClear}>
            Limpar
          </button>
          <button className="btn primary" onClick={onApply}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}