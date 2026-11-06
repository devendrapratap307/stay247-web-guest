import { api } from '../../../services/api-client';
import type { Receipt } from '../types/receipt.types';

/** The guest's own order or booking, rendered like the business's receipt. */
export const receiptApi = { get: (kind: 'order' | 'booking', id: string) => api.get<Receipt>(`/guest/receipts/${kind}/${id}`) };
