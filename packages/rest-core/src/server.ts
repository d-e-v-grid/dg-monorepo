import { checkZodSchema } from './zod-utils';
import { HTTPStatusCode } from './status-codes';
import { ResponseValidationError } from './response-validation-error';
import {
  AppRoute,
  ContractNoBody,
  ContractAnyType,
  ContractNoBodyType,
  ContractOtherResponse,
} from './dsl';

export const isAppRouteResponse = (
  value: unknown,
): value is { status: HTTPStatusCode; body?: any } => (
  value != null &&
  typeof value === 'object' &&
  'status' in value &&
  typeof value.status === 'number'
);

export const isAppRouteOtherResponse = (
  response?:
    | ContractAnyType
    | ContractNoBodyType
    | ContractOtherResponse<ContractAnyType>,
): response is ContractOtherResponse<ContractAnyType> => (
  response != null &&
  typeof response === 'object' &&
  'contentType' in response
);

export const isAppRouteNoBody = (
  response:
    | ContractAnyType
    | ContractNoBodyType
    | ContractOtherResponse<ContractAnyType>,
): response is ContractNoBodyType => response === ContractNoBody;

export const validateResponse = ({
  appRoute,
  response,
}: {
  appRoute: AppRoute;
  response: { status: number; body?: unknown };
}): { status: number; body?: unknown } => {
  if (isAppRouteResponse(response)) {
    const responseType = appRoute.responses[response.status];

    const responseSchema = isAppRouteOtherResponse(responseType)
      ? responseType.body
      : responseType;

    const responseValidation = checkZodSchema(response.body, responseSchema);

    if (!responseValidation.success) {
      throw new ResponseValidationError(appRoute, responseValidation.error);
    }

    return {
      status: response.status,
      body: responseValidation.data,
    };
  }

  return response;
};
