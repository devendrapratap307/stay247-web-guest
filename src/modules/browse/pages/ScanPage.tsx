import { QrFlow } from '../components/QrFlow';

export function ScanPage() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="hero" style={{ padding: 22 }}>
        <h1 style={{ fontSize: 24 }}>Scan QR</h1>
        <div style={{ color: '#ffffffcc' }}>Table, bay, room, counter or shop</div>
      </div>
      <QrFlow />
    </div>
  );
}
