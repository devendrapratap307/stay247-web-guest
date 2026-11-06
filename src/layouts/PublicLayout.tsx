import type { ReactNode } from 'react';
import { APP_NAME } from '../config/constants';

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <header className="header"><strong>{APP_NAME}</strong></header>
      <main className="main" style={{ margin: '0 auto' }}>{children}</main>
    </div>
  );
}
