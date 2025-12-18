import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AdminUser } from '../entities/admin-user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly adminUserRepository;
    private readonly jwtService;
    constructor(adminUserRepository: Repository<AdminUser>, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            email: string;
            name: string;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
            id: number;
            email: string;
            name: string;
        };
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        email: string;
        name: string;
        createdAt: Date;
    }>;
}
