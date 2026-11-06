import { api } from '../../../services/api-client';
import type { Order } from '../types/order.types';

export const orderApi = { mine: (cursor = 0, limit = 20) => api.list<Order>('/guest/orders', { cursor, limit }) };
