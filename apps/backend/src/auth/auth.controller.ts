import {
    Controller,
    Get,
    RequestMapping,
    RequestMethod,
    Body,
    UseGuards,
    Req,
    Res,
} from '@nestjs/common';
import { Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterJobSeekerDto } from './dto/register-job-seeker.dto';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
        isVerified: boolean;
    };
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    private setAuthCookie(res: Response, accessToken: string) {
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });
    }

    @RequestMapping({ path: 'register/job-seeker', method: RequestMethod.POST })
    async registerJobSeeker(
        @Body() dto: RegisterJobSeekerDto,
    ) {
        const result = await this.authService.registerJobSeeker(dto);

        return {
            message: result.message,
            user: result.user,
            requiresVerification: result.requiresVerification,
            verificationPreviewUrl: result.verificationPreviewUrl,
        };
    }

    @RequestMapping({ path: 'register/employer', method: RequestMethod.POST })
    async registerEmployer(
        @Body() dto: RegisterEmployerDto,
    ) {
        const result = await this.authService.registerEmployer(dto);

        return {
            message: result.message,
            user: result.user,
            requiresVerification: result.requiresVerification,
            verificationPreviewUrl: result.verificationPreviewUrl,
        };
    }

    @RequestMapping({ path: 'login', method: RequestMethod.POST })
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(dto);

        this.setAuthCookie(res, result.accessToken);

        return {
            message: result.message,
            user: result.user
        }
    }

    @RequestMapping({ path: 'verify-email', method: RequestMethod.POST })
    verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.token);
    }

    @UseGuards(JwtAuthGuard)
    @RequestMapping({ path: 'verification-link', method: RequestMethod.POST })
    requestVerificationLink(@Req() req: AuthenticatedRequest) {
        return this.authService.requestVerificationLink(req.user.id);
    }

    @RequestMapping({ path: 'forgot-password', method: RequestMethod.POST })
    requestPasswordReset(@Body() dto: ForgotPasswordDto) {
        return this.authService.requestPasswordReset(dto);
    }

    @RequestMapping({ path: 'reset-password', method: RequestMethod.POST })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: AuthenticatedRequest) {
        return this.authService.me(req.user.id);
    }

    @RequestMapping({ path: 'logout', method: RequestMethod.POST })
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('accessToken');
        return { message: 'Logged out successfully' };
    }
}
