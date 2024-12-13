import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Reflector } from "@nestjs/core";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const customMeta =
      this.reflector.get<any>("customMeta", context.getHandler()) || {};

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const statusCode = response?.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((data: any) => {
        if (
          data &&
          typeof data === "object" &&
          "data" in data &&
          "meta" in data
        ) {
          return {
            status: "success",
            message: "Request completed successfully",
            statusCode,
            ...data,
          };
        }

        return {
          status: "success",
          message: "Request completed successfully",
          statusCode,
          data: data,
          meta: {
            timestamp: new Date().toISOString(),
            ...customMeta,
          },
        };
      })
    );
  }
}
