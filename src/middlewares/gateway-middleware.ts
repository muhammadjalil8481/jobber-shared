import { Request } from 'express';
import JWT from 'jsonwebtoken';
import { NotAuthorizedError } from '../error-handler';

const tokens: string[] = [
  'auth',
  'seller',
  'gig',
  'search',
  'buyer',
  'message',
  'order',
  'review',
];

interface TokenPayload {
  id: string;
  iat: number;
}

export function verifyGatewayRequest(req: Request): void {
  const token: string = req.headers?.gatewayToken as string;
  if (!token)
    throw new NotAuthorizedError(
      'Invalid request',
      'verifyGatewayRequest method'
    );

  try {
    const payload: TokenPayload = JWT.verify(token, '') as TokenPayload;
    if (!tokens?.includes(payload.id)) {
      throw new NotAuthorizedError(
        'Invalid request',
        'verifyGatewayRequest method'
      );
    }
  } catch (err) {
    throw new NotAuthorizedError(
      'Invalid request',
      'verifyGatewayRequest method catch block'
    );
  }
}
