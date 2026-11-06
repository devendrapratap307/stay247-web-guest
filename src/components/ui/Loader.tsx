export function Loader({ label = 'Loading' }: { label?: string }) {
  return <div role="status" aria-label={label} className="spinner" />;
}
