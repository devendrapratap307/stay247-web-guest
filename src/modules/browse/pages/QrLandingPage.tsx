import { useParams } from 'react-router-dom';
import { QrFlow } from '../components/QrFlow';

/** /q/:code — the QR deep link a phone camera opens. Resolves straight away (after sign-in if needed). */
export function QrLandingPage() {
  const { code = '' } = useParams();
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <QrFlow key={code} initialCode={code} />
    </div>
  );
}
