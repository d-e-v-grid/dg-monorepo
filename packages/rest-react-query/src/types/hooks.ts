import { AppRoute, ClientArgs, AppRouteFunction } from '@devgrid/rest-core';
import {
  QueryKey,
  QueryClient,
  InfiniteData,
  FetchQueryOptions,
  FetchInfiniteQueryOptions,
} from '@tanstack/react-query';

import { RequestData, DataResponse, ErrorResponse } from './common';
import {
  UseQueryResult,
  UseQueriesResult,
  UseMutationResult,
  DefinedUseQueryResult,
  UseInfiniteQueryResult,
  UseSuspenseQueryResult,
  UseSuspenseQueriesResult,
  DefinedUseInfiniteQueryResult,
  UseSuspenseInfiniteQueryResult,
} from './hooks-results';
import {
  UseQueryOptions,
  UseQueriesOptions,
  TsRestQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  UseSuspenseQueryOptions,
  UseSuspenseQueriesOptions,
  UseQueryOptionsWithInitialData,
  UseSuspenseInfiniteQueryOptions,
  UseQueryOptionsWithoutInitialData,
  UseInfiniteQueryOptionsWithInitialData,
  UseInfiniteQueryOptionsWithoutInitialData,
} from './hooks-options';

export interface QueryHooks<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TQueryFnData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
> {
  query: AppRouteFunction<TAppRoute, TClientArgs>;

  useQuery<TData = TQueryFnData>(
    options: UseQueryOptionsWithInitialData<TAppRoute, TClientArgs, TData>,
    queryClient?: QueryClient,
  ): DefinedUseQueryResult<TAppRoute, TData, TError>;

  useQuery<TData = TQueryFnData>(
    options: UseQueryOptionsWithoutInitialData<TAppRoute, TClientArgs, TData>,
    queryClient?: QueryClient,
  ): UseQueryResult<TAppRoute, TData, TError>;

  useQuery<TData = TQueryFnData>(
    options: UseQueryOptions<TAppRoute, TClientArgs, TData>,
    queryClient?: QueryClient,
  ): UseQueryResult<TAppRoute, TData, TError>;

  useSuspenseQuery<TData = TQueryFnData>(
    options: UseSuspenseQueryOptions<TAppRoute, TClientArgs, TData>,
    queryClient?: QueryClient,
  ): UseSuspenseQueryResult<TAppRoute, TData, TError>;

  useQueries<
    T extends Array<any>,
    TCombinedResult = UseQueriesResult<TAppRoute, T>,
  >(
    options: UseQueriesOptions<TAppRoute, TClientArgs, T, TCombinedResult>,
    queryClient?: QueryClient,
  ): TCombinedResult;

  useSuspenseQueries<
    T extends Array<any>,
    TCombinedResult = UseSuspenseQueriesResult<TAppRoute, T>,
  >(
    options: UseSuspenseQueriesOptions<
      TAppRoute,
      TClientArgs,
      T,
      TCombinedResult
    >,
    queryClient?: QueryClient,
  ): TCombinedResult;

  useInfiniteQuery<TData = InfiniteData<TQueryFnData>, TPageParam = unknown>(
    options: UseInfiniteQueryOptionsWithInitialData<
      TAppRoute,
      TClientArgs,
      TData,
      TPageParam
    >,
    queryClient?: QueryClient,
  ): DefinedUseInfiniteQueryResult<TAppRoute, TData, TError>;

  useInfiniteQuery<TData = InfiniteData<TQueryFnData>, TPageParam = unknown>(
    options: UseInfiniteQueryOptionsWithoutInitialData<
      TAppRoute,
      TClientArgs,
      TData,
      TPageParam
    >,
    queryClient?: QueryClient,
  ): UseInfiniteQueryResult<TAppRoute, TData, TError>;

  useInfiniteQuery<TData = InfiniteData<TQueryFnData>, TPageParam = unknown>(
    options: UseInfiniteQueryOptions<TAppRoute, TClientArgs, TData, TPageParam>,
    queryClient?: QueryClient,
  ): UseInfiniteQueryResult<TAppRoute, TData, TError>;

  useSuspenseInfiniteQuery<
    TData = InfiniteData<TQueryFnData>,
    TPageParam = unknown,
  >(
    options: UseSuspenseInfiniteQueryOptions<
      TAppRoute,
      TClientArgs,
      TData,
      TPageParam
    >,
    queryClient?: QueryClient,
  ): UseSuspenseInfiniteQueryResult<TAppRoute, TData, TError>;

  usePrefetchQuery<TData = TQueryFnData>(
    options: FetchQueryOptions<TQueryFnData, TError, TData> &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): void;

  usePrefetchInfiniteQuery<TData = TQueryFnData, TPageParam = unknown>(
    options: FetchInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      QueryKey,
      TPageParam
    > &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): void;
}

export interface MutationHooks<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
  TVariables = RequestData<TAppRoute, TClientArgs>,
> {
  mutate: AppRouteFunction<TAppRoute, TClientArgs>;

  useMutation<TContext = unknown>(
    options?: UseMutationOptions<TAppRoute, TClientArgs, TContext>,
    queryClient?: QueryClient,
  ): UseMutationResult<
    TAppRoute,
    TClientArgs,
    TData,
    TError,
    TVariables,
    TContext
  >;
}