import { request } from './client';
import type { CompetitionDetails, CompetitionSummary, MutationResult, User } from './types';

export const competitionsApi = {
  list: () => request<{ competitions: CompetitionSummary[] }>('/competitions').then((d) => d.competitions),

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
