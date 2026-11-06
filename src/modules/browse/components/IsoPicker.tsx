import { useId, useState, type CSSProperties } from 'react';
import type { MapNode } from '../types/browse.types';

export interface IsoFloor { id: string; name: string; cells: MapNode[] }

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { numeric: true });

/** Groups bookable nodes of `type` by their parent (a floor / area) for the stacked 3D view. */
export function buildFloors(nodes: MapNode[], type: string, maxFloors = 6): IsoFloor[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const groups = new Map<string, MapNode[]>();
  nodes.filter((n) => n.type === type).forEach((n) => {
    const k = n.parent_id ?? 'root';
    groups.set(k, [...(groups.get(k) ?? []), n]);
  });
  return [...groups.entries()]
    .map(([id, cells]) => ({ id, name: byId.get(id)?.name ?? (id === 'root' ? 'Ground' : 'Area'), cells: cells.sort(byName) }))
    .sort(byName)
    .slice(0, maxFloors);
}

/** "Room 101" → "R101", "Table 2" → "T2" (cells are small). */
export const shortLabel = (name: string) => (name.length <= 5 ? name : (name[0]!.toUpperCase() + (/\d+/.exec(name)?.[0] ?? name.slice(1, 4))));

const STATUS_LABEL = { free: 'free', busy: 'booked', held: 'on hold' } as const;

interface Props { nodes: MapNode[]; type: string; selectedId?: string | null; onPick: (n: MapNode) => void; onBusy?: (n: MapNode) => void }

/** Isometric floor picker (prototype isoHTML): floors stacked, free = green, busy = red, selected = gradient; tilt/rotate/explode. */
export function IsoPicker({ nodes, type, selectedId, onPick, onBusy }: Props) {
  const [tilt, setTilt] = useState(55);
  const [rot, setRot] = useState(-35);
  const [gap, setGap] = useState(70);
  const id = useId();
  const floors = buildFloors(nodes, type);
  if (!floors.length) return null;
  return (
    <div>
      <div className="iso">
        <div className="stage" style={{ transform: `rotateX(${tilt}deg) rotateZ(${rot}deg)`, '--g': `${gap}px` } as CSSProperties}>
          {floors.map((f, i) => (
            <div key={f.id} className="fl" role="group" aria-label={f.name} style={{ '--i': i, '--cols': Math.min(6, Math.max(2, Math.ceil(Math.sqrt(f.cells.length * 1.4)))) } as CSSProperties}>
              <b className="fln">{f.name}</b>
              {f.cells.map((c) => {
                const free = c.status === 'free';
                const sel = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`rm ${c.status === 'busy' ? 'bz' : c.status === 'held' ? 'held' : ''} ${sel ? 'sel' : ''}`}
                    aria-pressed={sel}
                    aria-disabled={!free || undefined}
                    aria-label={`${c.name} · ${STATUS_LABEL[c.status]}`}
                    title={`${c.name} · ${STATUS_LABEL[c.status]}`}
                    onClick={() => (free ? onPick(c) : onBusy?.(c))}
                  >{shortLabel(c.name)}</button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="lg">🟢 free · 🔴 booked · 🟣 selected</div>
      <div className="isoc">
        <label htmlFor={`${id}-t`}>Tilt<input id={`${id}-t`} type="range" min={10} max={80} value={tilt} onChange={(e) => setTilt(+e.target.value)} /></label>
        <label htmlFor={`${id}-r`}>Rotate<input id={`${id}-r`} type="range" min={-90} max={90} value={rot} onChange={(e) => setRot(+e.target.value)} /></label>
        <label htmlFor={`${id}-g`}>Explode<input id={`${id}-g`} type="range" min={15} max={140} value={gap} onChange={(e) => setGap(+e.target.value)} /></label>
      </div>
    </div>
  );
}
