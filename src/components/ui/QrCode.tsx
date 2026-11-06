import { useMemo } from 'react';
import { qrEncode, qrPath } from '../../utils/qr.utils';

/** Scannable QR (SVG, crisp at any size and in print). Falls back to the raw text if it cannot be encoded. */
export function QrCode({ value, size = 140, label = 'QR code' }: { value: string; size?: number; label?: string }) {
  const m = useMemo(() => { try { return qrEncode(value); } catch { return null; } }, [value]);
  if (!m) return <code>{value}</code>;
  const n = m.length + 8;
  return (
    <span className="qrbox">
      <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} role="img" aria-label={label} shapeRendering="crispEdges">
        <rect width={n} height={n} fill="#fff" />
        <path d={qrPath(m)} fill="#111" />
      </svg>
    </span>
  );
}
