import type { FastifyReply } from 'fastify';

import { Reflector } from '@nestjs/core';
import { of, map, catchError, Observable, throwError } from 'rxjs';
import {
  Inject,
  Optional,
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import {
  AppRoute,
  validateResponse,
  isAppRouteResponse,
  TsRestResponseError,
  isAppRouteOtherResponse,
} from '@devgrid/rest-core';

import { TsRestAppRouteMetadataKey } from './constants';
import { TS_REST_MODULE_OPTIONS_TOKEN } from './ts-rest.module';
import { evaluateTsRestOptions, type MaybeTsRestOptions } from './ts-rest-options';

@Injectable()
export class TsRestInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @Optional()
    @Inject(TS_REST_MODULE_OPTIONS_TOKEN)
    private globalOptions: MaybeTsRestOptions,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res: FastifyReply = context.switchToHttp().getResponse();

    const appRoute = this.reflector.get<AppRoute | undefined>(
      TsRestAppRouteMetadataKey,
      context.getHandler(),
    );

    if (!appRoute) {
      // this will respond with a 500 error without revealing this error message in the response body
      throw new Error('Make sure your route is decorated with @TsRest()');
    }

    const options = evaluateTsRestOptions(this.globalOptions, context);

    return next.handle().pipe(
      catchError((err) => {
        if (err instanceof TsRestResponseError) {
          return of({
            status: err.statusCode,
            body: err.body,
          });
        }

        return throwError(() => err);
      }),
      map((value) => {
        if (isAppRouteResponse(value)) {
          const statusCode = value.status;

          const response = options.validateResponses
            ? validateResponse({
              appRoute,
              response: value,
            })
            : value;

          const responseType = appRoute.responses[statusCode];
          if (isAppRouteOtherResponse(responseType)) {
            res.header('content-type', responseType.contentType);
          }

          res.status(response.status);
          return response.body;
        }

        return value;
      }),
    );
  }
}
