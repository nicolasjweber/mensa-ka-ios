import { getCustomAuthHeader } from '@/lib/storage/secureClient';
import type { Canteen, Meal } from '@/types/mensa';
import { GET_MEAL_DETAIL_QUERY, GET_MEAL_PLAN_QUERY } from './queries';

export const DEFAULT_API_URL = 'https://api.mensa-ka.de/';

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{ message?: string }>;
}

export function resolveApiUrl(customApiUrl?: string | null): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const candidate = customApiUrl?.trim() || envUrl?.trim() || DEFAULT_API_URL;
  return candidate;
}

export async function graphqlRequest<TData, TVariables extends Record<string, unknown>>({
  query,
  variables,
  operationName,
  forceRefresh = false,
  customApiUrl = null,
}: {
  query: string;
  variables: TVariables;
  operationName: string;
  forceRefresh?: boolean;
  customApiUrl?: string | null;
}): Promise<TData> {
  const baseUrl = resolveApiUrl(customApiUrl);
  const endpoint = forceRefresh
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}refresh=1`
    : baseUrl;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (forceRefresh) {
    headers['Cache-Control'] = 'no-cache';
    headers.Pragma = 'no-cache';
    headers['X-Refresh'] = 'true';
  }

  const customAuth = await getCustomAuthHeader();
  if (customAuth) {
    headers.Authorization = customAuth;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
      operationName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Server request failed (${response.status})`);
  }

  const body = (await response.json()) as GraphQLResponse<TData>;
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    throw new Error(body.errors[0]?.message || 'GraphQL request failed');
  }

  if (!body.data) {
    throw new Error('Unexpected API response format');
  }

  return body.data;
}

export async function fetchMealPlan(
  date: string,
  options: { forceRefresh?: boolean; customApiUrl?: string | null } = {},
): Promise<Canteen[]> {
  const data = await graphqlRequest<{ getCanteens: Canteen[] }, { date: string }>({
    query: GET_MEAL_PLAN_QUERY,
    variables: { date },
    operationName: 'GetMealPlanForDay',
    forceRefresh: options.forceRefresh,
    customApiUrl: options.customApiUrl,
  });

  if (!Array.isArray(data.getCanteens)) {
    throw new Error('Unexpected API response format');
  }
  return data.getCanteens;
}

export async function fetchMealDetail(
  params: { date: string; mealId: string; lineId: string },
  options: { customApiUrl?: string | null } = {},
): Promise<Meal | null> {
  const data = await graphqlRequest<
    { getMeal: Meal | null },
    { date: string; mealId: string; lineId: string }
  >({
    query: GET_MEAL_DETAIL_QUERY,
    variables: params,
    operationName: 'GetMeal',
    customApiUrl: options.customApiUrl,
  });

  return data.getMeal ?? null;
}
