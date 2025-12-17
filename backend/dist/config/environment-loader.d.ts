export declare class EnvironmentService {
    private static instance;
    private loaded;
    static getInstance(): EnvironmentService;
    loadEnvironment(): void;
    private hasSystemVariables;
    private loadEncryptedEnvironment;
    private getEncryptionKeyFromSecrets;
    private loadSeparatedFiles;
    private parseAndLoadVariables;
    validateRequiredVariables(): void;
}
