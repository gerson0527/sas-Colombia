'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from './api-client';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useApiCollection(path: string): UseApiResult<any[]> {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: any[] }>(path);
      setData(res.data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useCustomers(): UseApiResult<any[]> {
  return useApiCollection('/v1/customers');
}

export function useProducts(): UseApiResult<any[]> {
  return useApiCollection('/v1/products');
}

export function useSuppliers(): UseApiResult<any[]> {
  return useApiCollection('/v1/suppliers');
}

export function useInvoices(): UseApiResult<any[]> {
  return useApiCollection('/v1/invoices');
}

export function useInventoryMovements(): UseApiResult<any[]> {
  return useApiCollection('/v1/inventory/movements');
}

export function useCashSessions(): UseApiResult<any[]> {
  return useApiCollection('/v1/cash-sessions');
}
