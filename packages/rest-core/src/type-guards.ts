import { AppRoute } from './dsl';
import {
  ClientInferResponses,
  InferResponseUndefinedStatusCodes,
} from './infer-types';
import {
  HTTPStatusCode,
  ErrorHttpStatusCode,
  SuccessfulHttpStatusCode,
} from './status-codes';

export const isResponse = <T extends AppRoute>(
  response: unknown,
  contractEndpoint?: T,
): response is ClientInferResponses<T, HTTPStatusCode> => (
  typeof response === 'object' &&
  response !== null &&
  'status' in response &&
  'body' in response &&
  typeof response.status === 'number' &&
  response.status >= 200 &&
  response.status < 600 &&
  (contractEndpoint?.strictStatusCodes
    ? Object.keys(contractEndpoint.responses).includes(
      response.status.toString(),
    )
    : true)
);

export const isSuccessResponse = <T extends AppRoute>(
  response: unknown,
  contractEndpoint?: T,
): response is ClientInferResponses<T, SuccessfulHttpStatusCode> => (
  isResponse(response, contractEndpoint) &&
  response.status >= 200 &&
  response.status < 300
);

export const isErrorResponse = <T extends AppRoute>(
  response: unknown,
  contractEndpoint?: T,
): response is ClientInferResponses<T, ErrorHttpStatusCode> => (
  isResponse(response, contractEndpoint) &&
  !isSuccessResponse(response, contractEndpoint)
);

export const isUnknownResponse = <T extends AppRoute>(
  response: unknown,
  contractEndpoint: T,
): response is ClientInferResponses<
  T,
  InferResponseUndefinedStatusCodes<T>,
  'ignore'
> => (
  isResponse(response) &&
  !Object.keys(contractEndpoint.responses).includes(
    response.status.toString(),
  )
);

export const isUnknownSuccessResponse = <T extends AppRoute>(
  response: unknown,
  contractEndpoint: T,
): response is ClientInferResponses<
  T,
  InferResponseUndefinedStatusCodes<T, SuccessfulHttpStatusCode>,
  'ignore'
> => (
  isSuccessResponse(response) && isUnknownResponse(response, contractEndpoint)
);

export const isUnknownErrorResponse = <T extends AppRoute>(
  response: unknown,
  contractEndpoint: T,
): response is ClientInferResponses<
  T,
  InferResponseUndefinedStatusCodes<T, ErrorHttpStatusCode>,
  'ignore'
> => (
  isErrorResponse(response) && isUnknownResponse(response, contractEndpoint)
);

export const exhaustiveGuard = <T extends { status: never }>(
  response: T,
): never => {
  throw new Error(`Unreachable code: Response status is ${response.status}`);
};