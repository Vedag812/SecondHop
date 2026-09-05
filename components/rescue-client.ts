'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Snapshot } from '@/lib/rescue';

export async function rescueRequest<T>(
  body?: Record<string, unknown>,
  token?: string,
  caseId?: string,
): Promise<T> {
  const response = await fetch(
    `/api/rescue${!body && caseId ? `?caseId=${encodeURIComponent(caseId)}` : ''}`,
    {
      method: body ? 'POST' : 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { 'x-handoff-token': token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? 'Unable to complete this action.');
  return data;
}
export function useRescue() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      setData(await rescueRequest<Snapshot>());
      setError('');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to load the ledger.',
      );
    }
  }, []);
  useEffect(() => {
    const first = setTimeout(() => {
      void refresh();
    }, 0);
    const timer = setInterval(() => {
      void refresh();
    }, 4000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);
  return { data, error, refresh, setData };
}
