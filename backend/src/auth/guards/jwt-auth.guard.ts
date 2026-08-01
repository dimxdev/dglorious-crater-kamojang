import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Rejects requests without a valid `Authorization: Bearer <token>` header.
 * Attaches the resolved user to `request.user` (see JwtStrategy).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
