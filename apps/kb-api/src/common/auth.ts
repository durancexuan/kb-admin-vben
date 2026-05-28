import type { FastifyReply, FastifyRequest } from 'fastify';

import jwt from 'jsonwebtoken';

import { config } from '../config.js';
import { useResponseError } from './response.js';

export interface AuthUser {
  username: string;
}

export function verifyAccessToken(request: FastifyRequest): AuthUser | null {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as AuthUser;
    if (!decoded.username) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (error?: Error) => void,
) {
  const user = verifyAccessToken(request);
  if (!user) {
    reply
      .code(401)
      .send(
        useResponseError('Unauthorized Exception', 'Unauthorized Exception'),
      );
    return;
  }
  request.user = user;
  done();
}

export function requireRobotKey(
  request: FastifyRequest,
  reply: FastifyReply,
  done: (error?: Error) => void,
) {
  const apiKey = request.headers['x-robot-api-key'];
  if (apiKey !== config.ROBOT_API_KEY) {
    reply.code(401).send(useResponseError('Invalid robot api key'));
    return;
  }
  done();
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
