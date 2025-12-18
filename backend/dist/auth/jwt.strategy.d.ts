import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { AdminUser } from '../entities/admin-user.entity';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly adminUserRepository;
    constructor(adminUserRepository: Repository<AdminUser>);
    validate(payload: any): Promise<{
        id: number;
        email: string;
        name: string;
    }>;
}
export {};
