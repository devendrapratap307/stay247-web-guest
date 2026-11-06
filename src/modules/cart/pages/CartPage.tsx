import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { useT } from '../../../i18n/i18n';
import { CartPanel } from '../components/CartPanel';

/** Phone-width cart/checkout (the side panel sits under the content there); same panel as the desktop. */
export function CartPage() {
  const t = useT();
  return (
    <div className="stack" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="pagehead"><h1>{t('cart.title')}</h1><Link className="btn secondary sm" to={ROUTES.browse}>← {t('nav.browse')}</Link></div>
      <CartPanel />
    </div>
  );
}
