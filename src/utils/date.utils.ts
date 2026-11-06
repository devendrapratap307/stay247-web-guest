export const formatDateTime = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' });
/** <input type="datetime-local"> value → ISO string (UTC). */
export const localInputToIso = (v: string) => new Date(v).toISOString();
export const isoToLocalInput = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
