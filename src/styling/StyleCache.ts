import type { LogLevel, DevToolsTheme } from '../types/core.js';

interface CacheKey {
    level: LogLevel | 'success';
    theme: DevToolsTheme;
    presetName?: string;
    hasPrefix: boolean;
    hasLocation: boolean;
}

interface CacheEntry {
    styles: string[];
    format: string;
    createdAt: number;
    hits: number;
}

export interface StyleCacheConfig {
    maxEntries?: number;
    ttl?: number;
    enabled?: boolean;
}

const DEFAULT_CONFIG: Required<StyleCacheConfig> = {
    maxEntries: 100,
    ttl: 5 * 60 * 1000,
    enabled: true
};

export class StyleCache {
    private cache: Map<string, CacheEntry> = new Map();
    private config: Required<StyleCacheConfig>;
    private hitCount = 0;
    private missCount = 0;

    constructor(config: StyleCacheConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    private generateKey(key: CacheKey): string {
        return `${key.level}:${key.theme}:${key.presetName || 'default'}:${key.hasPrefix}:${key.hasLocation}`;
    }

    get(key: CacheKey): CacheEntry | null {
        if (!this.config.enabled) return null;

        const cacheKey = this.generateKey(key);
        const entry = this.cache.get(cacheKey);

        if (!entry) {
            this.missCount++;
            return null;
        }

        if (Date.now() - entry.createdAt > this.config.ttl) {
            this.cache.delete(cacheKey);
            this.missCount++;
            return null;
        }

        entry.hits++;
        this.cache.delete(cacheKey);
        this.cache.set(cacheKey, entry);
        this.hitCount++;

        return entry;
    }

    set(key: CacheKey, format: string, styles: string[]): void {
        if (!this.config.enabled) return;

        const cacheKey = this.generateKey(key);

        if (this.cache.size >= this.config.maxEntries) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(cacheKey, {
            format,
            styles: [...styles],
            createdAt: Date.now(),
            hits: 0
        });
    }

    clear(): void {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }

    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        hits: number;
        misses: number;
    } {
        const total = this.hitCount + this.missCount;
        return {
            size: this.cache.size,
            maxSize: this.config.maxEntries,
            hitRate: total > 0 ? this.hitCount / total : 0,
            hits: this.hitCount,
            misses: this.missCount
        };
    }

    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }

    isEnabled(): boolean {
        return this.config.enabled;
    }
}

let _styleCache: StyleCache | null = null;

export function getStyleCache(): StyleCache {
    if (!_styleCache) {
        _styleCache = new StyleCache();
    }
    return _styleCache;
}
