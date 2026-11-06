import { Button } from '../../../components/ui/Button';
import { usePay } from '../hooks/useRazorpayCheckout';

export function PayButton({ orderId, label = 'Pay now' }: { orderId: string; label?: string }) {
  const pay = usePay();
  return <Button size="sm" loading={pay.isPending} onClick={() => pay.mutate(orderId)}>{label}</Button>;
}
