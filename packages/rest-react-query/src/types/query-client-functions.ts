import { AppRoute, ClientArgs } from '@devgrid/rest-core';
import {
  QueryKey,
  QueryState,
  InfiniteData,
  QueryFilters,
  SetDataOptions,
  FetchQueryOptions,
  EnsureQueryDataOptions,
  FetchInfiniteQueryOptions,
} from '@tanstack/react-query';

import { TsRestQueryOptions } from './hooks-options';
import { DataResponse, ErrorResponse } from './common';

type Updater<TInput, TOutput> = TOutput | ((input: TInput) => TOutput);

export interface TsRestQueryClientFunctions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TQueryFnData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
> {
  getQueryData(queryKey: QueryKey): TQueryFnData | undefined;

  ensureQueryData<TData = TQueryFnData>(
    options: EnsureQueryDataOptions<TQueryFnData, TError, TData> &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): Promise<TData>;

  getQueriesData(
    filters: QueryFilters,
  ): Array<[QueryKey, TQueryFnData | undefined]>;

  setQueryData(
    queryKey: QueryKey,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): TQueryFnData | undefined;

  setQueriesData(
    filters: QueryFilters,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): Array<[QueryKey, TQueryFnData | undefined]>;

  getQueryState(
    queryKey: QueryKey,
  ): QueryState<TQueryFnData, TError> | undefined;

  fetchQuery<TData = TQueryFnData>(
    options: FetchQueryOptions<TQueryFnData, TError, TData> &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): Promise<TData>;

  prefetchQuery<TData = TQueryFnData>(
    options: FetchQueryOptions<TQueryFnData, TError, TData, QueryKey> &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): Promise<void>;

  fetchInfiniteQuery<TData = TQueryFnData, TPageParam = unknown>(
    options: FetchInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      QueryKey,
      TPageParam
    > &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): Promise<InfiniteData<TData, TPageParam>>;

  prefetchInfiniteQuery<TData = TQueryFnData, TPageParam = unknown>(
    options: FetchInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      QueryKey,
      TPageParam
    > &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): Promise<void>;
}