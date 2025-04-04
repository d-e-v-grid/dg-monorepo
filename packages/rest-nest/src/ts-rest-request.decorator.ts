import type { FastifyRequest } from 'fastify';

import {
  AppRoute,
  checkZodSchema,
  AppRouteMutation,
  zodErrorResponse,
  ServerInferRequest,
  parseJsonQueryObject,
} from '@devgrid/rest-core';
import {
  Inject,
  Optional,
  Injectable,
  PipeTransform,
  ExecutionContext,
  BadRequestException,
  createParamDecorator,
} from '@nestjs/common';

import { TsRestAppRouteMetadataKey } from './constants';
import { TS_REST_MODULE_OPTIONS_TOKEN } from './ts-rest.module';
import { evaluateTsRestOptions, type MaybeTsRestOptions } from './ts-rest-options';

export type TsRestRequestShape<TRoute extends AppRoute> = ServerInferRequest<
  TRoute,
  FastifyRequest['headers']
>;

@Injectable()
class TsRestValidatorPipe implements PipeTransform {
  constructor(
    @Optional()
    @Inject(TS_REST_MODULE_OPTIONS_TOKEN)
    private globalOptions: MaybeTsRestOptions,
  ) { }

  transform(ctx: ExecutionContext): TsRestRequestShape<AppRouteMutation> {
    const appRoute: AppRouteMutation | undefined = Reflect.getMetadata(
      TsRestAppRouteMetadataKey,
      ctx.getHandler(),
    );

    if (!appRoute) {
      // this will respond with a 500 error without revealing this error message in the response body
      throw new Error('Make sure your route is decorated with @TsRest()');
    }

    const req: FastifyRequest = ctx.switchToHttp().getRequest();
    const options = evaluateTsRestOptions(this.globalOptions, ctx);

    const pathParamsResult = checkZodSchema(req.params, appRoute.pathParams, {
      passThroughExtraKeys: true,
    });

    if (!pathParamsResult.success) {
      throw new BadRequestException(zodErrorResponse(pathParamsResult.error));
    }

    const headersResult = checkZodSchema(req.headers, appRoute.headers, {
      passThroughExtraKeys: true,
    });

    if (!headersResult.success && options.validateRequestHeaders) {
      throw new BadRequestException(zodErrorResponse(headersResult.error));
    }

    const query = options.jsonQuery
      ? parseJsonQueryObject(req.query as Record<string, string>)
      : req.query;

    const queryResult = checkZodSchema(query, appRoute.query);
    if (!queryResult.success && options.validateRequestQuery) {
      throw new BadRequestException(zodErrorResponse(queryResult.error));
    }

    const bodyResult = checkZodSchema(
      req.body,
      (appRoute as AppRoute).method === 'GET' ? null : appRoute.body,
    );

    if (!bodyResult.success && options.validateRequestBody) {
      throw new BadRequestException(zodErrorResponse(bodyResult.error));
    }

    return {
      query: queryResult.success ? queryResult.data : req.query,
      params: pathParamsResult.data as any,
      body: bodyResult.success ? bodyResult.data : req.body,
      headers: headersResult.success
        ? (headersResult.data as TsRestRequestShape<typeof appRoute>['headers'])
        : req.headers,
    };
  }
}

/**
 * Parameter decorator used to parse, validate and return the typed request object
 *
 * @deprecated Please use `TsRestHandler` instead - will be removed in v4
 */
export const TsRestRequest = () =>
  createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx)(TsRestValidatorPipe);

