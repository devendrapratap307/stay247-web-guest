import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';

// BarcodeDetector is not in TypeScript's DOM lib yet (Chromium / Android / Safari 17+ ship it).
interface DetectedCode { rawValue: string }
interface BarcodeDetectorLike { detect: (src: CanvasImageSource | ImageBitmap) => Promise<DetectedCode[]> }
type BarcodeDetectorCtor = new (o?: { formats?: string[] }) => BarcodeDetectorLike;
declare global { interface Window { BarcodeDetector?: BarcodeDetectorCtor } }

type CamState = 'idle' | 'starting' | 'live' | 'unsupported' | 'denied';

const SCAN_EVERY_MS = 250;
export const canScanWithCamera = () => typeof window !== 'undefined' && !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia;

interface Props {
  /** Raw text read from the QR, or the typed code. */
  onCode: (raw: string) => void;
  busy?: boolean;
  /** Start the camera on mount (default true). */
  autoStart?: boolean;
}

/**
 * Viewfinder with a scanning line. Uses the native BarcodeDetector + camera when available (no library), with torch and
 * "scan from a photo"; otherwise, and always, the code printed under the QR can be typed in.
 */
export function QrScanner({ onCode, busy, autoStart = true }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const detector = useRef<BarcodeDetectorLike | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  const [cam, setCam] = useState<CamState>(canScanWithCamera() ? 'idle' : 'unsupported');
  const [torch, setTorch] = useState<boolean | null>(null);
  const [code, setCode] = useState('');

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  const emit = useCallback((raw: string) => {
    if (done.current) return;
    done.current = true;
    stop();
    onCode(raw);
  }, [onCode, stop]);

  const start = useCallback(async () => {
    if (!canScanWithCamera()) { setCam('unsupported'); return; }
    setCam('starting');
    done.current = false;
    try {
      detector.current ??= new window.BarcodeDetector!({ formats: ['qr_code'] });
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      stream.current = s;
      const v = video.current;
      if (!v) { stop(); return; }
      v.srcObject = s;
      await v.play().catch(() => undefined);
      const track = s.getVideoTracks()[0];
      const caps = (track?.getCapabilities?.() ?? {}) as { torch?: boolean };
      setTorch(caps.torch ? false : null);
      setCam('live');
    } catch {
      stop();
      setCam('denied');
    }
  }, [stop]);

  // Detection loop while the camera is live.
  useEffect(() => {
    if (cam !== 'live') return;
    let timer = 0;
    let alive = true;
    const tick = async () => {
      const v = video.current;
      if (!alive || !v || !detector.current) return;
      if (v.readyState >= 2) {
        try {
          const found = await detector.current.detect(v);
          if (found[0]?.rawValue) { emit(found[0].rawValue); return; }
        } catch { /* frame not ready */ }
      }
      timer = window.setTimeout(() => void tick(), SCAN_EVERY_MS);
    };
    void tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [cam, emit]);

  // Start once on mount; always release the camera on unmount.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (autoStart && !autoStarted.current && canScanWithCamera()) { autoStarted.current = true; void start(); }
    return stop;
  }, [autoStart, start, stop]);

  const toggleTorch = async () => {
    const track = stream.current?.getVideoTracks()[0];
    if (!track || torch === null) return;
    try { await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] }); setTorch(!torch); } catch { setTorch(null); }
  };

  const fromPhoto = async (f: File | undefined) => {
    if (!f) return;
    if (!window.BarcodeDetector) { setCam('unsupported'); return; }
    try {
      detector.current ??= new window.BarcodeDetector({ formats: ['qr_code'] });
      const bmp = await createImageBitmap(f);
      const found = await detector.current.detect(bmp);
      if (found[0]?.rawValue) { done.current = false; emit(found[0].rawValue); } else onCode('');
    } catch { onCode(''); }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) { done.current = false; emit(code.trim()); }
  };

  const hint = {
    idle: 'Point the camera at a StayServe QR',
    starting: 'Starting camera…',
    live: 'Point the camera at a StayServe QR',
    unsupported: 'Camera scanning is not available in this browser. Type the code printed under the QR.',
    denied: 'Camera access was blocked. Allow it in your browser settings, or type the code.',
  }[cam];

  return (
    <div>
      <div className="vf" aria-live="polite">
        <video ref={video} muted playsInline aria-label="Camera preview" style={{ display: cam === 'live' ? 'block' : 'none' }} />
        <div className="vfq" aria-hidden />
        {(cam === 'live' || cam === 'starting' || cam === 'idle') && <div className="vfl" aria-hidden />}
        <div className="vfh">{busy ? 'Reading code…' : hint}</div>
      </div>
      <form className="qrrow" onSubmit={submit}>
        {torch !== null && <Button size="sm" variant="secondary" onClick={() => void toggleTorch()} aria-pressed={torch}>🔦 Torch</Button>}
        {(cam === 'denied' || (cam === 'idle' && !autoStart)) && <Button size="sm" variant="secondary" onClick={() => void start()}>📷 Use camera</Button>}
        {typeof window !== 'undefined' && window.BarcodeDetector && <Button size="sm" variant="secondary" onClick={() => file.current?.click()}>🖼 Gallery</Button>}
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void fromPhoto(e.target.files?.[0])} />
        <label className="sr-only" htmlFor="qr-code">Enter code</label>
        <input id="qr-code" className="input" placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="off" autoComplete="off" spellCheck={false} />
        <Button type="submit" size="sm" loading={busy} disabled={!code.trim()}>Go</Button>
      </form>
    </div>
  );
}
