export interface DefaultUser {
    username: string;
    email: string;
    password: string;
    role: string;
    displayName: string;
    status: string;
}
export declare const defaultUsers: DefaultUser[];
export declare function getDefaultUserSettings(): {
    theme: string;
    language: string;
    timezone: string;
    notifications: {
        email: boolean;
        browser: boolean;
        security: boolean;
    };
};
export declare function generatePasswordHash(password: string, saltRounds?: number): Promise<{
    hash: string;
    salt: string;
}>;
//# sourceMappingURL=default-users.d.ts.map