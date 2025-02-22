import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SET_META_KEY } from '../decorators/set-meta.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const methodMeta = this.reflector.get<Record<string, unknown>>(
      SET_META_KEY,
      context.getHandler()
    );
    const classMeta = this.reflector.get<Record<string, unknown>>(
      SET_META_KEY,
      context.getClass()
    );

    const safeMethodMeta =
      methodMeta && typeof methodMeta === 'object' ? methodMeta : {};
    const safeClassMeta =
      classMeta && typeof classMeta === 'object' ? classMeta : {};

    const combinedMeta = { ...safeClassMeta, ...safeMethodMeta };

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const statusCode = response?.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((responseData) => {
        if (responseData && typeof responseData === 'object') {
          const { data, meta } = responseData;
          const isNestedData =
            data && typeof data === 'object' && 'data' in data;

          return {
            status: 'success',
            message: 'Request completed successfully',
            statusCode,
            meta: {
              ...(meta || {}),
              ...combinedMeta,
              timestamp: new Date().toISOString(),
            },
            data: isNestedData ? data.data : data || responseData,
          };
        }

        return {
          status: 'success',
          message: 'Request completed successfully',
          statusCode,
          meta: {
            ...combinedMeta,
            timestamp: new Date().toISOString(),
          },
          data: responseData,
        };
      })
    );
  }
}
