import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Custom decorator to extract the authenticated user from the request object.
 *
 * This decorator retrieves the user object set in `req.user` after authentication.
 * It can be used in controllers to access the currently logged-in user.
 */
export const GetAuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
