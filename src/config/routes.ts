export const ROUTES = {
  login: '/login',
  scan: '/scan', qr: (code: string) => `/q/${code}`,
  browse: '/browse',
  cart: '/cart',
  orders: '/orders',
  profile: '/profile',
} as const;
