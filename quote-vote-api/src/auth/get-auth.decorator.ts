import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the Clerk auth object from the request.
 * The `auth` object is attached to the request by the `ClerkExpressWithAuth` middleware.
 *
 * @example
 * ```ts
 * \@UseGuards(ClerkAuthGuard)
 * \@Post('protected-route')
 * myProtectedRoute(@GetAuth() auth: { userId: string }) {
 *   const { userId } = auth;
 *   // ... use userId
 * }
 * ```
 */
export const GetAuth = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // The auth object is added by the Clerk middleware.
    // It contains information like the userId.
    return request.auth;
  },
);