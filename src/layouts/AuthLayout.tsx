import type { ReactNode } from 'react';
import { APP_NAME } from '../config/constants';

export function AuthLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <main className="auth-wrap">
      <div className="card auth-card">
        <p className="muted">{APP_NAME}</p>
        <h1>{title}</h1>
        {children}
      </div>
    </main>
  );
}
