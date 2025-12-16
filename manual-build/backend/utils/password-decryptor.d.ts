export declare class PasswordDecryptor {
    static decryptPassword(encryptedPassword: string, originalPassword: string): string;
    static isEncrypted(password: string): boolean;
    static getDecryptedDbPassword(): string;
    private static decryptAES;
    private static derivePasswordFromMasterKey;
}
