/**
 * Servicio de Geolocalización de IP usando ip.guide
 *
 * Este servicio enriquece las direcciones IP con información de:
 * - Ubicación geográfica (ciudad, país, coordenadas)
 * - Red (CIDR, rango de hosts)
 * - Sistema Autónomo (ASN, organización, ISP)
 *
 * API utilizada: https://ip.guide (gratuita, sin API key)
 */

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
  // Datos de ubicación
  city?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  // Datos de red
  networkCidr?: string;
  // Datos del ISP/ASN
  asn?: number;
  isp?: string;
  organization?: string;
  // Metadatos
  enrichedAt: Date;
  enrichmentSource: string;
  isPrivateIp: boolean;
}

class IpGeolocationService {
  private static readonly API_URL = "https://ip.guide";
  private static readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
  private static readonly REQUEST_TIMEOUT_MS = 3000; // 3 segundos

  // Cache simple en memoria para evitar llamadas repetidas
  private cache: Map<string, { data: EnrichedIpData; timestamp: number }> =
    new Map();

  /**
   * Verifica si una IP es privada/local
   */
  private isPrivateIp(ip: string): boolean {
    // IPv4 privadas
    const privateRanges = [
      /^127\./, // Loopback
      /^10\./, // Clase A privada
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Clase B privada
      /^192\.168\./, // Clase C privada
      /^169\.254\./, // Link-local
      /^0\./, // Red actual
      /^::1$/, // IPv6 loopback
      /^fe80:/i, // IPv6 link-local
      /^fc00:/i, // IPv6 unique local
      /^fd00:/i, // IPv6 unique local
    ];

    return privateRanges.some((range) => range.test(ip));
  }

  /**
   * Limpia la IP de prefijos IPv6-mapped IPv4
   */
  private cleanIpAddress(ip: string): string {
    // Remover prefijo ::ffff: de IPv6-mapped IPv4
    if (ip.startsWith("::ffff:")) {
      return ip.substring(7);
    }
    return ip;
  }

  /**
   * Obtiene datos enriquecidos de una IP
   */
  async getIpData(ipAddress: string): Promise<EnrichedIpData> {
    const cleanIp = this.cleanIpAddress(ipAddress);

    // Verificar si es IP privada
    if (this.isPrivateIp(cleanIp)) {
      return {
        ip: cleanIp,
        isPrivateIp: true,
        enrichedAt: new Date(),
        enrichmentSource: "local",
      };
    }

    // Verificar cache
    const cached = this.cache.get(cleanIp);
    if (
      cached &&
      Date.now() - cached.timestamp < IpGeolocationService.CACHE_TTL_MS
    ) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        IpGeolocationService.REQUEST_TIMEOUT_MS
      );

      const response = await fetch(
        `${IpGeolocationService.API_URL}/${cleanIp}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `⚠️ [IpGeolocation] Error obteniendo datos para IP ${cleanIp}: ${response.status}`
        );
        return this.createFallbackData(cleanIp);
      }

      const data = (await response.json()) as IpGeolocationData;
      const enrichedData = this.transformResponse(data);

      // Guardar en cache
      this.cache.set(cleanIp, {
        data: enrichedData,
        timestamp: Date.now(),
      });

      console.log(
        `✅ [IpGeolocation] Datos enriquecidos para ${cleanIp}: ${
          enrichedData.city || "N/A"
        }, ${enrichedData.country || "N/A"}`
      );

      return enrichedData;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.warn(
          `⚠️ [IpGeolocation] Timeout obteniendo datos para IP ${cleanIp}`
        );
      } else {
        console.error(`❌ [IpGeolocation] Error para IP ${cleanIp}:`, error);
      }
      return this.createFallbackData(cleanIp);
    }
  }

  /**
   * Transforma la respuesta de ip.guide al formato interno
   */
  private transformResponse(data: IpGeolocationData): EnrichedIpData {
    return {
      ip: data.ip,
      // Ubicación
      city: data.location?.city,
      country: data.location?.country,
      countryCode: data.network?.autonomous_system?.country,
      timezone: data.location?.timezone,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      // Red
      networkCidr: data.network?.cidr,
      // ISP/ASN
      asn: data.network?.autonomous_system?.asn,
      isp: data.network?.autonomous_system?.name,
      organization: data.network?.autonomous_system?.organization,
      // Metadatos
      enrichedAt: new Date(),
      enrichmentSource: "ip.guide",
      isPrivateIp: false,
    };
  }

  /**
   * Crea datos de fallback cuando no se puede obtener información
   */
  private createFallbackData(ip: string): EnrichedIpData {
    return {
      ip,
      isPrivateIp: false,
      enrichedAt: new Date(),
      enrichmentSource: "fallback",
    };
  }

  /**
   * Limpia entradas antiguas del cache
   */
  cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > IpGeolocationService.CACHE_TTL_MS) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): { size: number; oldestEntry: Date | null } {
    let oldest: number | null = null;
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

// Exportar instancia singleton
export const ipGeolocationService = new IpGeolocationService();
