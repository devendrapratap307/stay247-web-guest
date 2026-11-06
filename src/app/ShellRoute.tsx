import { Outlet } from 'react-router-dom';
import { GuestLayout } from '../layouts/GuestLayout';

export function ShellRoute() {
  return <GuestLayout><Outlet /></GuestLayout>;
}
