import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { competitionsApi } from '../api/competitions';
import type { CompetitionDetails, ListFilters, MutationResult } from '../api/types';
import { useLanguage } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { DETAILS_POLL_INTERVAL_MS } from '../config';
import { useServerNow } from './useCountdown';

export const competitionKeys = {
  all: ['competitions'] as const,
  list: (lang: string, userId: string | null, filters: ListFilters) =>
    ['competitions', 'list', lang, userId, filters] as const,
  categories: (lang: string) => ['competitions', 'categories', lang] as const,
  details: (idOrSlug: string, lang: string, userId: string | null) =>
    ['competitions', 'details', idOrSlug, lang, userId] as const,
  mine: (lang: string, userId: string | null) => ['competitions', 'mine', lang, userId] as const,
};

export function useCompetitionList(filters: ListFilters = {}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  return useQuery({
    queryKey: competitionKeys.list(lang, user?.id ?? null, filters),
    queryFn: () => competitionsApi.list(filters),
    staleTime: 10_000,
    placeholderData: (previous) => previous,
  });
}

export function useCategories() {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: competitionKeys.categories(lang),
    queryFn: competitionsApi.categories,
    staleTime: 5 * 60_000,
  });
}

export function useMyRegistrations() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  return useQuery({
    queryKey: competitionKeys.mine(lang, user?.id ?? null),
    queryFn: competitionsApi.myRegistrations,
    enabled: Boolean(user),
    staleTime: 10_000,
  });
}

/**
 * Details view-model. Polls so spots-left and phase stay consistent with what
 * other users are doing, and re-fetches the moment a countdown target passes
 * so the UI flips state (e.g. registration closes) without a manual refresh.
 */
export function useCompetitionDetails(idOrSlug: string) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = competitionKeys.details(idOrSlug, lang, user?.id ?? null);

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => competitionsApi.details(idOrSlug, signal),
    refetchInterval: DETAILS_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
    placeholderData: (previous) => previous,
  });

  const now = useServerNow();
  const targetAt = query.data?.countdown?.targetAt;
  const heldUntil = query.data?.viewer.registration?.expiresAt;
  useEffect(() => {
    const boundaries = [targetAt, heldUntil].filter(Boolean) as string[];
    const crossed = boundaries.some((iso) => {
      const delta = now.getTime() - new Date(iso).getTime();
      return delta >= 0 && delta < 1500;
    });
    if (crossed) void queryClient.invalidateQueries({ queryKey });
  }, [now, targetAt, heldUntil, queryClient, queryKey]);

  return query;
}

/** Shared plumbing: every mutation returns the fresh view-model, so write it straight into the cache. */
function useDetailsMutation<TVars>(
  idOrSlug: string,
  mutationFn: (vars: TVars) => Promise<MutationResult>
) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.setQueryData<CompetitionDetails>(
        competitionKeys.details(idOrSlug, lang, user?.id ?? null),
        result.competition
      );
      queryClient.setQueryData<CompetitionDetails>(
        competitionKeys.details(result.competition.id, lang, user?.id ?? null),
        result.competition
      );
      void queryClient.invalidateQueries({ queryKey: ['competitions', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['competitions', 'mine'] });
    },
    onError: () => {
      // Any conflict (full, closed, expired) means our snapshot is stale: refresh it.
      void queryClient.invalidateQueries({ queryKey: ['competitions', 'details', idOrSlug] });
    },
  });
}

export function useCompetitionActions(idOrSlug: string, competitionId: string | undefined) {
  const id = competitionId ?? idOrSlug;
  const register = useDetailsMutation<void>(idOrSlug, () => competitionsApi.register(id));
  const confirmPayment = useDetailsMutation<{ paymentId: string; signature: string }>(idOrSlug, (body) =>
    competitionsApi.confirmPayment(id, body)
  );
  const cancel = useDetailsMutation<void>(idOrSlug, () => competitionsApi.cancelRegistration(id));
  const submit = useDetailsMutation<{ title?: string; mediaUrl: string }>(idOrSlug, (body) =>
    competitionsApi.submit(id, body)
  );
  return { register, confirmPayment, cancel, submit };
}
