// Storage Manager - LocalStorage caching with TTL
class StorageManager {
    static PREFIX = 'leaderboard_';

    /**
     * Set a value in localStorage with optional TTL
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttlSeconds - Time to live in seconds
     */
    static set(key, value, ttlSeconds = 300) {
        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                ttl: ttlSeconds * 1000
            };
            localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
        } catch (e) {
            console.warn('LocalStorage full or disabled:', e);
        }
    }

    /**
     * Get a value from localStorage
     * @param {string} key - Cache key
     * @returns {*} Cached value or null if expired/not found
     */
    static get(key) {
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            if (!item) return null;

            const data = JSON.parse(item);
            const now = Date.now();
            const age = now - data.timestamp;

            if (age > data.ttl) {
                localStorage.removeItem(this.PREFIX + key);
                return null;
            }

            return data.value;
        } catch (e) {
            console.warn('Error reading from localStorage:', e);
            return null;
        }
    }

    /**
     * Check if cache key exists and is not expired
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists and is fresh
     */
    static has(key) {
        return this.get(key) !== null;
    }

    /**
     * Check how long until expiration
     * @param {string} key - Cache key
     * @returns {number} Milliseconds until expiration, -1 if not found
     */
    static ttlRemaining(key) {
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            if (!item) return -1;

            const data = JSON.parse(item);
            const now = Date.now();
            const age = now - data.timestamp;
            const remaining = data.ttl - age;

            return remaining > 0 ? remaining : -1;
        } catch (e) {
            return -1;
        }
    }

    /**
     * Clear a specific cache key
     * @param {string} key - Cache key
     */
    static clear(key) {
        localStorage.removeItem(this.PREFIX + key);
    }

    /**
     * Clear all cached data
     */
    static clearAll() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Get cache age in seconds
     * @param {string} key - Cache key
     * @returns {number} Age in seconds, -1 if not found
     */
    static getAge(key) {
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            if (!item) return -1;

            const data = JSON.parse(item);
            const age = Date.now() - data.timestamp;
            return Math.round(age / 1000);
        } catch (e) {
            return -1;
        }
    }
}
