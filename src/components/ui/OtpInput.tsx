import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Called once all digits are filled (e.g. to submit). */
  onComplete?: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  invalid?: boolean;
  label?: string;
}

/** One box per digit: typing advances, Backspace goes back, pasting a whole code fills every box. */
export function OtpInput({ value, onChange, onComplete, length = 6, autoFocus, invalid, label = 'Verification code' }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const commit = (next: string) => {
    const v = next.replace(/\D/g, '').slice(0, length);
    onChange(v);
    if (v.length === length) onComplete?.(v);
  };
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const onInput = (i: number, raw: string) => {
    let d = raw.replace(/\D/g, '');
    if (!d) return;
    // Typing into a filled box: keep only the new digit.
    if (d.length === 2 && digits[i]) d = d.startsWith(digits[i]) ? d.slice(1) : d.slice(0, 1);
    if (d.length > 1) { commit(value.slice(0, i) + d); focus(i + d.length); return; }
    const arr = digits.slice();
    arr[i] = d;
    commit(arr.join('').slice(0, length));
    focus(i + 1);
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = digits.slice();
      if (arr[i]) { arr[i] = ''; commit(arr.join('')); } else if (i > 0) { arr[i - 1] = ''; commit(arr.join('')); focus(i - 1); }
    } else if (e.key === 'ArrowLeft') focus(i - 1);
    else if (e.key === 'ArrowRight') focus(i + 1);
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (d) { commit(d); focus(d.length); }
  };

  return (
    <div className="otp" role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
