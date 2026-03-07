// API Client - Handles backend API and Solana RPC communication
class APIClient {
    static BASE_URL = '/api';
    static BACKEND_TIMEOUT = 10000; // 10 seconds
    static REQUEST_CACHE_TTL = 60; // 1 minute

    /**
     * Fetch leaderboard data
     * @param {string} ranking - 'bacon', 'pr-count', or 'avg-value'
     * @param {number} limit - Items per page
     * @param {number} offset - Pagination offset
     * @returns {Promise<Object>} Leaderboard data
     */
    static async getLeaderboard(ranking = 'bacon', limit = 100, offset = 0) {
        const params = new URLSearchParams({
            ranking: ranking,
            limit: limit,
            offset: offset
        });

        return this._fetchWithCache(`leaderboard?${params}`, 300); // 5 min cache
    }

    /**
     * Fetch dashboard metrics
     * @returns {Promise<Object>} Dashboard metrics
     */
    static async getMetrics() {
        return this._fetchWithCache('metrics', 120); // 2 min cache
    }

    /**
     * Fetch recent transactions
     * @param {number} limit - Number of transactions to fetch
     * @param {number} offset - Pagination offset
     * @returns {Promise<Object>} Transaction data
     */
    static async getTransactions(limit = 20, offset = 0) {
        const params = new URLSearchParams({
            limit: limit,
            offset: offset
        });

        return this._fetchWithCache(`transactions?${params}`, 300); // 5 min cache
    }

    /**
     * Internal method to fetch with caching
     * @private
     */
    static async _fetchWithCache(endpoint, ttl = 300) {
        const cacheKey = `api:${endpoint}`;

        // Try to get from cache first
        const cached = StorageManager.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await fetch(`${this.BASE_URL}/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Cache the successful response
            StorageManager.set(cacheKey, data, ttl);

            return data;
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error);

            // Return cached data as fallback even if expired
            const staleCache = localStorage.getItem(StorageManager.PREFIX + cacheKey);
            if (staleCache) {
                try {
                    return JSON.parse(staleCache).value;
                } catch (e) {
                    console.error('Failed to parse stale cache:', e);
                }
            }

            throw error;
        }
    }

    /**
     * Fetch with timeout
     * @private
     */
    static async _fetchWithTimeout(url, options = {}, timeout = this.BACKEND_TIMEOUT) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Force refresh - bypass cache
     */
    static async refresh(endpoint) {
        const cacheKey = `api:${endpoint}`;
        StorageManager.clear(cacheKey);

        if (endpoint.includes('leaderboard')) {
            return this.getLeaderboard();
        } else if (endpoint.includes('metrics')) {
            return this.getMetrics();
        } else if (endpoint.includes('transactions')) {
            return this.getTransactions();
        }
    }

    /**
     * Health check - verify API is responsive
     */
    static async healthCheck() {
        try {
            const response = await this._fetchWithTimeout(
                `${this.BASE_URL}/health`,
                { method: 'GET' },
                3000
            );
            return response.ok;
        } catch (e) {
            console.warn('Health check failed:', e);
            return false;
        }
    }
}
