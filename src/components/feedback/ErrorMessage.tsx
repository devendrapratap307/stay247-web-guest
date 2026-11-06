import { errorMessage } from '../../services/api-error';
import { Button } from '../ui/Button';

export function ErrorMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="errorbox" role="alert">
      <div>{errorMessage(error)}</div>
      {onRetry && <Button size="sm" variant="secondary" onClick={onRetry} style={{ marginTop: 8 }}>Try again</Button>}
    </div>
  );
}
