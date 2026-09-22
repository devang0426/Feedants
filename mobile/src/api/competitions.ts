import { request } from './client';
import type {
  Category,
  CompetitionDetails,
  CompetitionSummary,
  ListFilters,
  MutationResult,
  MyRegistration,
  User,
} from './types';

const toQuery = (filters: ListFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.phase) params.set('phase', filters.phase);
  const s = params.toString();
  return s ? `?${s}` : '';
};

export const competitionsApi = {
  list: (filters?: ListFilters) =>
    request<{ competitions: CompetitionSummary[] }>(`/competitions${toQuery(filters)}`).then((d) => d.competitions),

  categories: () => request<{ categories: Category[] }>('/competitions/categories').then((d) => d.categories),

  myRegistrations: () =>
    request<{ registrations: MyRegistration[] }>('/me/registrations').then((d) => d.registrations),

  details: (idOrSlug: string, signal?: AbortSignal) =>
    request<{ competition: CompetitionDetails }>(`/competitions/${idOrSlug}`, { signal }).then(
      (d) => d.competition
    ),

  register: (id: string) =>
    request<MutationResult>(`/competitions/${id}/registrations`, { method: 'POST' }),

  confirmPayment: (id: string, body: { paymentId: string; signature: string }) =>
    request<MutationResult>(`/competitions/${id}/registrations/confirm`, { method: 'POST', body }),

  cancelRegistration: (id: string) =>
    request<MutationResult>(`/competitions/${id}/registrations`, { method: 'DELETE' }),

  submit: (id: string, body: { title?: string; mediaUrl: string; mediaType?: 'video' | 'image' | 'audio' }) =>
    request<MutationResult>(`/competitions/${id}/submissions`, { method: 'PUT', body }),
};

export const authApi = {
  demoLogin: (body: { email: string; name?: string }) =>
    request<{ token: string; user: User }>('/auth/demo-login', { method: 'POST', body }),
  me: () => request<{ user: User }>('/auth/me').then((d) => d.user),
};
