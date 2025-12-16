export declare class FileCleanupService {
    private static isInitialized;
    private static uploadsBaseDir;
    static initialize(uploadsDir: string): void;
    private static cleanupTempFiles;
    private static generateStorageReport;
    private static performWeeklyMaintenance;
    private static verifyFileIntegrity;
    private static cleanupEmptyDirectories;
    private static formatBytes;
    static runManualCleanup(): Promise<void>;
    static stopScheduledJobs(): void;
}
