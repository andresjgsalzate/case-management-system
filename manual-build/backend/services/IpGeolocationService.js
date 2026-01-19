"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipGeolocationService = void 0;
class IpGeolocationService {
    constructor() {
        this.cache = new Map();
    }
    isPrivateIp(ip) {
        const privateRanges = [
            /^127\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^169\.254\./,
            /^0\./,
            /^::1$/,
            /^fe80:/i,
            /^fc00:/i,
            /^fd00:/i,
        ];
        return privateRanges.some((range) => range.test(ip));
    }
    cleanIpAddress(ip) {
        if (ip.startsWith("::ffff:")) {
            return ip.substring(7);
        }
        return ip;
    }
    async getIpData(ipAddress) {
        const cleanIp = this.cleanIpAddress(ipAddress);
        if (this.isPrivateIp(cleanIp)) {
            return {
                ip: cleanIp,
                isPrivateIp: true,
                enrichedAt: new Date(),
                enrichmentSource: "local",
            };
        }
        const cached = this.cache.get(cleanIp);
        if (cached &&
            Date.now() - cached.timestamp < IpGeolocationService.CACHE_TTL_MS) {
            return cached.data;
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), IpGeolocationService.REQUEST_TIMEOUT_MS);
            const response = await fetch(`${IpGeolocationService.API_URL}/${cleanIp}`, {
                signal: controller.signal,
                headers: {
                    Accept: "application/json",
                },
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                console.warn(`⚠️ [IpGeolocation] Error obteniendo datos para IP ${cleanIp}: ${response.status}`);
                return this.createFallbackData(cleanIp);
            }
            const data = (await response.json());
            const enrichedData = this.transformResponse(data);
            this.cache.set(cleanIp, {
                data: enrichedData,
                timestamp: Date.now(),
            });
            console.log(`✅ [IpGeolocation] Datos enriquecidos para ${cleanIp}: ${enrichedData.city || "N/A"}, ${enrichedData.country || "N/A"}`);
            return enrichedData;
        }
        catch (error) {
            if (error.name === "AbortError") {
                console.warn(`⚠️ [IpGeolocation] Timeout obteniendo datos para IP ${cleanIp}`);
            }
            else {
                console.error(`❌ [IpGeolocation] Error para IP ${cleanIp}:`, error);
            }
            return this.createFallbackData(cleanIp);
        }
    }
    transformResponse(data) {
        return {
            ip: data.ip,
            city: data.location?.city,
            country: data.location?.country,
            countryCode: data.network?.autonomous_system?.country,
            timezone: data.location?.timezone,
            latitude: data.location?.latitude,
            longitude: data.location?.longitude,
            networkCidr: data.network?.cidr,
            asn: data.network?.autonomous_system?.asn,
            isp: data.network?.autonomous_system?.name,
            organization: data.network?.autonomous_system?.organization,
            enrichedAt: new Date(),
            enrichmentSource: "ip.guide",
            isPrivateIp: false,
        };
    }
    createFallbackData(ip) {
        return {
            ip,
            isPrivateIp: false,
            enrichedAt: new Date(),
            enrichmentSource: "fallback",
        };
    }
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > IpGeolocationService.CACHE_TTL_MS) {
                this.cache.delete(key);
            }
        }
    }
    getCacheStats() {
        let oldest = null;
        for (const value of this.cache.values()) {
            if (oldest === null || value.timestamp < oldest) {
                oldest = value.timestamp;
            }
        }
        return {
            size: this.cache.size,
            oldestEntry: oldest ? new Date(oldest) : null,
        };
    }
}
IpGeolocationService.API_URL = "https://ip.guide";
IpGeolocationService.CACHE_TTL_MS = 24 * 60 * 60 * 1000;
IpGeolocationService.REQUEST_TIMEOUT_MS = 3000;
exports.ipGeolocationService = new IpGeolocationService();
