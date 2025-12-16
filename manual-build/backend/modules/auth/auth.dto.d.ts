export declare class LoginDto {
    email: string;
    password: string;
    constructor(email: string, password: string);
}
export declare class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    constructor(email: string, password: string, fullName: string);
}
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        fullName?: string;
        roleName: string;
    };
    token: string;
    refreshToken: string;
}
