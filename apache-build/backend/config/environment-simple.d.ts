export declare class EnvironmentService {
    private static instance;
    private loaded;
    static getInstance(): EnvironmentService;
    loadEnvironment(): void;
    validateRequiredVariables(): void;
}
