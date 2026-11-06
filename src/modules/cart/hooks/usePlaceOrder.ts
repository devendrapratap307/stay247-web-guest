import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useTenantStore } from '../../../stores/tenant.store';
import { toast } from '../../../stores/ui.store';
import { newIdempotencyKey } from '../../../utils/format.utils';
import { cartApi } from '../api/cart.api';
import { cartSchema } from '../schemas/cart.schema';
import { useCartStore } from './useCartStore';

export function usePlaceOrder() {
  const qc = useQueryClient();
  const key = useRef(newIdempotencyKey());
  return useMutation({
    mutationFn: async () => {
      const { lines } = useCartStore.getState();
      const parsed = cartSchema.safeParse({ lines: lines.map((l) => ({ item_id: l.id, qty: l.qty })) });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
      const t = useTenantStore.getState();
      return cartApi.placeOrder(t.businessId!, t.resourceId, lines, key.current);
    },
    onSuccess: () => { key.current = newIdempotencyKey(); useCartStore.getState().clear(); toast.success('Order placed'); void qc.invalidateQueries({ queryKey: ['my-orders'] }); },
  });
}
