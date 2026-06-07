import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    tokenVersion: number;
}

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private readonly usersService: UsersService
    ) {
        super({
            jwtFromRequest: (req) => req?.cookies?.accessToken,
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
            ignoreExpiration: false,
        });
    }

    async validate(payload: JwtPayload): Promise<AuthUser> {
        const user = await this.usersService.findById(payload.sub);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (payload.tokenVersion !== user.authTokenVersion) {
            throw new UnauthorizedException('Session expired');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        return {
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
        };
    }
}
