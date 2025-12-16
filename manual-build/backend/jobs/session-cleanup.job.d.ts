export declare class SessionCleanupJob {
    private sessionService;
    private intervalId?;
    constructor();
    start(intervalMinutes?: number): void;
    stop(): void;
    runCleanup(): Promise<number>;
    getSessionStats(): Promise<{
        totalActiveSessions: number;
        sessionsByUser: Record<string, number>;
    }>;
}
