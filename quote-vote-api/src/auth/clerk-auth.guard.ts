import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  
  @Injectable()
  export class ClerkAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
  
      // The ClerkExpressWithAuth middleware populates req.auth. If it's missing, the user is not authenticated.
      if (!request.auth?.userId) {
        throw new UnauthorizedException('User is not authenticated.');
      }
      return true;
    }
  }
  
  