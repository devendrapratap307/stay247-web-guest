import { useEffect, useState, type ReactNode } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { FormInput } from '../../../components/form/FormInput';
import { applyServerErrors, useZodForm } from '../../../components/form/useZodForm';
import { Button } from '../../../components/ui/Button';
import { OtpInput } from '../../../components/ui/OtpInput';
import { ApiError, errorMessage } from '../../../services/api-error';
import { toast } from '../../../stores/ui.store';
import { useAuthDialog } from '../hooks/useAuthDialog';
import { useForgotPassword, useLogin, useRegister, useRequestOtp, useResendEmail, useResetPassword, useVerifyEmail, useVerifyOtp } from '../hooks/useAuth';
import {
  emailSchema, loginSchema, resetSchema, signupSchema,
  type EmailForm, type LoginForm, type ResetForm, type SignupForm,
} from '../schemas/auth.schema';
import { maskEmail, passwordScore, SCORE_COLOR, SCORE_LABEL } from '../utils/password';

const RESEND_SECONDS = 60;

/** Countdown used by every "Resend code" link (the server rate-limits too). */
function useCooldown(initial = RESEND_SECONDS) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, restart: () => setLeft(RESEND_SECONDS) };
}

function Steps({ items, current }: { items: string[]; current: number }) {
  return <div className="steps">{items.map((s, i) => <span key={s} className={`chip ${i <= current ? '' : 'dim'}`}>{i + 1}. {s}</span>)}</div>;
}

function Link_({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button type="button" className="linkbtn" onClick={onClick}>{children}</button>;
}

function StrengthBar({ password }: { password: string }) {
  const s = passwordScore(password);
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="pwbar" aria-hidden><i style={{ width: `${s * 25}%`, background: SCORE_COLOR[s] }} /></div>
      <small className="muted" aria-live="polite">{password ? SCORE_LABEL[s] : ''}</small>
    </div>
  );
}

function LoginScreen({ onDone }: { onDone: () => void }) {
  const go = useAuthDialog((s) => s.go);
  const login = useLogin();
  const resend = useResendEmail();
  const form = useZodForm<LoginForm>(loginSchema, { email: useAuthDialog.getState().email, password: '' });
  const submit = form.handleSubmit(async (v) => {
    try {
      await login.mutateAsync(v);
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.status === 403 && e.code === 'email_unverified') {
        resend.mutate(v.email);
        toast.info('Verify your email first. We sent you a new code.');
        go('verify', { email: v.email });
        return;
      }
      if (!applyServerErrors(form, e)) form.setError('password', { message: errorMessage(e) });
    }
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate>
        <h2>Welcome back</h2>
        <p className="muted">Log in to book, order and track your receipts</p>
        <FormInput name="email" label="Email" type="email" autoComplete="email" autoFocus />
        <FormInput name="password" label="Password" type="password" autoComplete="current-password" />
        <div className="row" style={{ justifyContent: 'space-between', margin: '0 0 12px' }}>
          <Link_ onClick={() => go('forgot', { email: form.getValues('email') })}>Forgot password?</Link_>
          <Link_ onClick={() => go('otp-login', { email: form.getValues('email') })}>Email me a code instead</Link_>
        </div>
        <Button type="submit" className="big" loading={login.isPending}>Log in</Button>
        <p className="muted" style={{ marginTop: 14 }}>New here? <Link_ onClick={() => go('signup')}>Create account</Link_></p>
      </form>
    </FormProvider>
  );
}

function OtpLoginScreen({ onDone }: { onDone: () => void }) {
  const { email: initial, go } = useAuthDialog();
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const request = useRequestOtp();
  const verify = useVerifyOtp();
  const cd = useCooldown(0);
  const form = useZodForm<EmailForm>(emailSchema, { email: initial });

  const send = form.handleSubmit(async (v) => {
    try { await request.mutateAsync(v.email); setEmail(v.email); cd.restart(); toast.success('Code sent. Check your email.'); }
    catch (e) { if (!applyServerErrors(form, e)) form.setError('email', { message: errorMessage(e) }); }
  });
  const check = async (c = code) => {
    if (!email) return;
    if (c.length < 6) { setErr('Enter all 6 digits'); return; }
    try { await verify.mutateAsync({ email, code: c }); onDone(); } catch (e) { setErr(errorMessage(e)); setCode(''); }
  };

  if (!email) {
    return (
      <FormProvider {...form}>
        <form onSubmit={send} noValidate>
          <h2>Log in with a code</h2>
          <p className="muted">We will email you a 6-digit code. No password needed.</p>
          <FormInput name="email" label="Email" type="email" autoComplete="email" autoFocus />
          <Button type="submit" className="big" loading={request.isPending}>Send code</Button>
          <p className="muted" style={{ marginTop: 14 }}><Link_ onClick={() => go('login')}>‹ Log in with password</Link_></p>
        </form>
      </FormProvider>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); void check(); }} noValidate>
      <h2>Enter the code</h2>
      <p className="muted">Sent to {maskEmail(email)} · expires in 5:00</p>
      <OtpInput value={code} onChange={(v) => { setCode(v); setErr(''); }} onComplete={(v) => void check(v)} autoFocus invalid={!!err} />
      <div role="alert" className="field-error" style={{ textAlign: 'center', minHeight: 20 }}>{err}</div>
      <Button type="submit" className="big" loading={verify.isPending}>Verify and log in</Button>
      <p className="muted" style={{ textAlign: 'center', marginTop: 12 }}>
        {cd.left > 0 ? `Resend in 0:${String(cd.left).padStart(2, '0')}` : <Link_ onClick={() => { request.mutate(email); cd.restart(); toast.success('New code sent'); }}>Resend code</Link_>}
        {' · '}<Link_ onClick={() => setEmail(null)}>Change email</Link_>
      </p>
    </form>
  );
}

function SignupScreen() {
  const go = useAuthDialog((s) => s.go);
  const register = useRegister();
  const form = useZodForm<SignupForm>(signupSchema, { name: '', email: '', password: '', confirm: '' });
  const pw = useWatch({ control: form.control, name: 'password' }) ?? '';
  const submit = form.handleSubmit(async (v) => {
    try {
      await register.mutateAsync({ name: v.name, email: v.email, password: v.password });
      toast.success('We sent a 6-digit code to your email');
      go('verify', { email: v.email });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) { form.setError('email', { message: 'An account with this email already exists. Log in instead.' }); return; }
      if (!applyServerErrors(form, e)) toast.error(errorMessage(e));
    }
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate>
        <h2>Create your account</h2>
        <p className="muted">Book and order in seconds · free forever for guests</p>
        <FormInput name="name" label="Full name" autoComplete="name" autoFocus />
        <FormInput name="email" label="Email" type="email" autoComplete="email" />
        <FormInput name="password" label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a number and a symbol" />
        <StrengthBar password={pw} />
        <FormInput name="confirm" label="Confirm password" type="password" autoComplete="new-password" />
        <Button type="submit" className="big" loading={register.isPending}>Send OTP</Button>
        <p className="muted" style={{ marginTop: 14 }}>Have an account? <Link_ onClick={() => go('login')}>Log in</Link_></p>
      </form>
    </FormProvider>
  );
}

function VerifyScreen({ onDone }: { onDone: () => void }) {
  const { email, go } = useAuthDialog();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const verify = useVerifyEmail();
  const resend = useResendEmail();
  const cd = useCooldown();
  const check = async (c = code) => {
    if (c.length < 6) { setErr('Enter all 6 digits'); return; }
    try { await verify.mutateAsync({ email, code: c }); onDone(); } catch (e) { setErr(errorMessage(e)); setCode(''); }
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); void check(); }} noValidate>
      <h2>Verify your email</h2>
      <p className="muted">Enter the 6-digit code we sent to {maskEmail(email)}</p>
      <OtpInput value={code} onChange={(v) => { setCode(v); setErr(''); }} onComplete={(v) => void check(v)} autoFocus invalid={!!err} />
      <div role="alert" className="field-error" style={{ textAlign: 'center', minHeight: 20 }}>{err}</div>
      <Button type="submit" className="big" loading={verify.isPending}>Verify &amp; continue</Button>
      <p className="muted" style={{ textAlign: 'center', marginTop: 12 }}>
        Expires in 5:00 ·{' '}
        {cd.left > 0 ? `Resend in 0:${String(cd.left).padStart(2, '0')}` : <Link_ onClick={() => { resend.mutate(email); cd.restart(); toast.success('New code sent'); }}>Resend code</Link_>}
      </p>
      <p className="muted" style={{ textAlign: 'center' }}><Link_ onClick={() => go('signup')}>‹ Use a different email</Link_></p>
    </form>
  );
}

const RESET_STEPS = ['Email', 'Verify', 'New password'];

function ForgotScreen() {
  const { email, go } = useAuthDialog();
  const forgot = useForgotPassword();
  const form = useZodForm<EmailForm>(emailSchema, { email });
  const submit = form.handleSubmit(async (v) => {
    // The server always answers 202 (no account enumeration); a 429 means too many requests.
    try { await forgot.mutateAsync(v.email); go('forgot-code', { email: v.email }); }
    catch (e) { if (!applyServerErrors(form, e)) form.setError('email', { message: errorMessage(e) }); }
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate>
        <Steps items={RESET_STEPS} current={0} />
        <h2>Forgot password?</h2>
        <p className="muted">Enter your account email and we will send a 6-digit code.</p>
        <FormInput name="email" label="Email" type="email" autoComplete="email" autoFocus />
        <Button type="submit" className="big" loading={forgot.isPending}>Send OTP</Button>
        <p className="muted" style={{ marginTop: 12 }}>Limit: 5 requests per hour per email.</p>
        <p className="muted"><Link_ onClick={() => go('login')}>‹ Back to login</Link_></p>
      </form>
    </FormProvider>
  );
}

function ForgotCodeScreen() {
  const { email, go } = useAuthDialog();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const forgot = useForgotPassword();
  const cd = useCooldown();
  const next = (c = code) => { if (c.length < 6) { setErr('Enter all 6 digits'); return; } go('reset', { code: c }); };
  return (
    <form onSubmit={(e) => { e.preventDefault(); next(); }} noValidate>
      <Steps items={RESET_STEPS} current={1} />
      <h2>Enter the code</h2>
      <p className="muted">Sent to {maskEmail(email)} · expires in 5:00</p>
      <OtpInput value={code} onChange={(v) => { setCode(v); setErr(''); }} onComplete={next} autoFocus invalid={!!err} />
      <div role="alert" className="field-error" style={{ textAlign: 'center', minHeight: 20 }}>{err}</div>
      <Button type="submit" className="big">Verify code</Button>
      <p className="muted" style={{ textAlign: 'center', marginTop: 12 }}>
        {cd.left > 0 ? `Resend in 0:${String(cd.left).padStart(2, '0')}` : <Link_ onClick={() => { forgot.mutate(email); cd.restart(); toast.success('New code sent'); }}>Resend code</Link_>}
        {' · '}<Link_ onClick={() => go('forgot')}>Change email</Link_>
      </p>
    </form>
  );
}

function ResetScreen() {
  const { email, code, go } = useAuthDialog();
  const reset = useResetPassword();
  const form = useZodForm<ResetForm>(resetSchema, { password: '', confirm: '' });
  const pw = useWatch({ control: form.control, name: 'password' }) ?? '';
  const submit = form.handleSubmit(async (v) => {
    try { await reset.mutateAsync({ email, code, password: v.password }); go('reset-done', { code: '' }); }
    catch (e) {
      if (applyServerErrors(form, e)) return;
      // Wrong / expired code: send the user back to re-enter it.
      if (e instanceof ApiError && (e.status === 400 || e.status === 422 || e.status === 410)) { toast.error(errorMessage(e)); go('forgot-code', { code: '' }); return; }
      toast.error(errorMessage(e));
    }
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate>
        <Steps items={RESET_STEPS} current={2} />
        <h2>Set a new password</h2>
        <p className="muted">At least 8 characters, with a number and a symbol.</p>
        <FormInput name="password" label="New password" type="password" autoComplete="new-password" autoFocus />
        <StrengthBar password={pw} />
        <FormInput name="confirm" label="Confirm password" type="password" autoComplete="new-password" />
        <Button type="submit" className="big" loading={reset.isPending}>Update password</Button>
      </form>
    </FormProvider>
  );
}

function ResetDoneScreen() {
  const go = useAuthDialog((s) => s.go);
  return (
    <div style={{ textAlign: 'center', paddingTop: 20 }}>
      <div style={{ fontSize: 56 }} aria-hidden>✅</div>
      <h2>Password updated</h2>
      <p className="muted">You were signed out on all other devices. Log in with your new password.</p>
      <Button className="big" onClick={() => go('login')}>Back to login</Button>
    </div>
  );
}

const RESET_FLOW = new Set(['forgot', 'forgot-code', 'reset', 'reset-done']);

/** All sign-in screens in the prototype's two-column card (gradient brand panel + form). */
export function AuthScreens({ onDone, onClose }: { onDone: () => void; onClose?: () => void }) {
  const screen = useAuthDialog((s) => s.screen);
  const reset = RESET_FLOW.has(screen);
  return (
    <div className="aw card" role="document">
      {onClose && <button type="button" className="iconbtn closex" aria-label="Close" onClick={onClose}>✕</button>}
      <div className="ab">
        <h1 style={{ margin: 0 }}>StayServe</h1>
        {reset ? (
          <><p>Reset your password securely.</p><div>✓ OTP sent to your email</div><div>✓ Code expires in 5 minutes</div><div>✓ Single-use and rate-limited</div></>
        ) : (
          <><p>Stays, food, parking, health and shops in one place.</p><div>✓ Scan a QR and order to your table</div><div>✓ Live order status</div><div>✓ GST receipts for every booking</div></>
        )}
      </div>
      <div className="af fd">
        {screen === 'login' && <LoginScreen onDone={onDone} />}
        {screen === 'otp-login' && <OtpLoginScreen onDone={onDone} />}
        {screen === 'signup' && <SignupScreen />}
        {screen === 'verify' && <VerifyScreen onDone={onDone} />}
        {screen === 'forgot' && <ForgotScreen />}
        {screen === 'forgot-code' && <ForgotCodeScreen />}
        {screen === 'reset' && <ResetScreen />}
        {screen === 'reset-done' && <ResetDoneScreen />}
      </div>
    </div>
  );
}
