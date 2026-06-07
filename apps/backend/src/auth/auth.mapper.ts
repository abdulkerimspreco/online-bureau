import { User } from '@prisma/client';
import { AuthResponseUser } from './auth.types';

export function toAuthResponseUser(user: User): AuthResponseUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
