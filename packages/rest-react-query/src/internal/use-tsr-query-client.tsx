'use client';

import React, { createContext } from 'react';
import { AppRouter, ClientArgs } from '@devgrid/rest-core';

import type { TsRestReactQueryClient } from '../types';

export const TsrQueryClientContext = createContext<
  TsRestReactQueryClient<any, any> | undefined
>(undefined);

export const useTsrQueryClient = <
  TContract extends AppRouter,
  TClientArgs extends ClientArgs,
>() => {
  const tsrQueryClient = React.useContext<
    TsRestReactQueryClient<TContract, TClientArgs> | undefined
  >(TsrQueryClientContext);

  if (!tsrQueryClient) {
    throw new Error(
      'tsrQueryClient not initialized. Use TsRestReactQueryProvider to initialize one.',
    );
  }

  return tsrQueryClient;
};