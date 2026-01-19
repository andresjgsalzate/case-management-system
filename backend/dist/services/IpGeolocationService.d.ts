export interface IpGeolocationData {
    ip: string;
    network?: {
        cidr: string;
        hosts?: {
            start: string;
            end: string;
        };
        autonomous_system?: {
            asn: number;
            name: string;
            organization: string;
            country: string;
            rir: string;
        };
    };
    location?: {
        city: string;
        country: string;
        timezone: string;
        latitude: number;
        longitude: number;
    };
}
export interface EnrichedIpData {
    ip: string;
    city?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    networkCidr?: string;
    asn?: number;
    isp?: string;
    organization?: string;
    enrichedAt: Date;
    enrichmentSource: string;
    isPrivateIp: boolean;
}
declare class IpGeolocationService {
    private static readonly API_URL;
    private static readonly CACHE_TTL_MS;
    private static readonly REQUEST_TIMEOUT_MS;
    private cache;
    private isPrivateIp;
    private cleanIpAddress;
    getIpData(ipAddress: string): Promise<EnrichedIpData>;
    private transformResponse;
    private createFallbackData;
    cleanCache(): void;
    getCacheStats(): {
        size: number;
        oldestEntry: Date | null;
    };
}
export declare const ipGeolocationService: IpGeolocationService;
export {};
