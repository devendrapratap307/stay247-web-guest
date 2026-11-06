import { api } from '../../../services/api-client';
import type { Bootstrap } from '../types/appconfig.types';

export const appconfigApi = {
  bootstrap: (businessType?: string) => api.get<Bootstrap>('/app/bootstrap', { app: api.audience, business_type: businessType }),
};
