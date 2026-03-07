// Real-Time Updater - Handles polling and change detection
class RealTimeUpdater {
    static pollingInterval = 30000; // 30 seconds
    static pollingHandle = null;
    static lastDataHash = null;
    static failureCount = 0;
    static maxFailures = 3;
    static isPolling = false;
    static callbacks = {
        onUpdate: [],
        onError: [],
        onPoll: []
    };

    /**
     * Start polling for updates
     */
    static startPolling() {
        if (this.isPolling) {
            console.warn('Polling already started');
            return;
        }

        this.isPolling = true;
        this.failureCount = 0;

        // First poll immediately
        this.poll();

        // Then set interval
        this.pollingHandle = setInterval(() => {
            this.poll();
        }, this.pollingInterval);

        console.log(`Polling started (interval: ${this.pollingInterval}ms)`);
    }

    /**
     * Stop polling
     */
    static stopPolling() {
        if (this.pollingHandle) {
            clearInterval(this.pollingHandle);
            this.pollingHandle = null;
        }
        this.isPolling = false;
        console.log('Polling stopped');
    }

    /**
     * Single poll operation
     */
    static async poll() {
        try {
            this._triggerCallback('onPoll');

            // Fetch latest data
            const [leaderboard, metrics, transactions] = await Promise.all([
                APIClient.getLeaderboard('bacon', 100, 0),
                APIClient.getMetrics(),
                APIClient.getTransactions(20, 0)
            ]);

            // Normalize data
            const normalizedLeaderboard = DataProcessor.normalizeLeaderboardData(leaderboard);
            const normalizedMetrics = DataProcessor.normalizeMetrics(metrics);
            const normalizedTransactions = DataProcessor.normalizeTransactions(transactions);

            // Check for changes using hash
            const combinedData = {
                leaderboard: normalizedLeaderboard,
                metrics: normalizedMetrics,
                transactions: normalizedTransactions
            };

            const newHash = DataProcessor.hashData(combinedData);

            if (newHash !== this.lastDataHash) {
                this.lastDataHash = newHash;
                this.failureCount = 0;

                // Trigger update callbacks
                this._triggerCallback('onUpdate', {
                    leaderboard: normalizedLeaderboard,
                    metrics: normalizedMetrics,
                    transactions: normalizedTransactions,
                    timestamp: new Date()
                });

                UIRenderer.updateLastUpdated(new Date());
                UIRenderer.hideRefreshIndicator();
            }

        } catch (error) {
            console.error('Polling error:', error);
            this.failureCount++;

            // Stop polling after max failures
            if (this.failureCount >= this.maxFailures) {
                console.error(`Polling failed ${this.maxFailures} times, stopping...`);
                this.stopPolling();
            }

            this._triggerCallback('onError', {
                error: error,
                failureCount: this.failureCount
            });
        }
    }

    /**
     * Register callback for updates
     * @param {string} event - Event type ('onUpdate', 'onError', 'onPoll')
     * @param {Function} callback - Callback function
     */
    static on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * Remove callback
     * @param {string} event - Event type
     * @param {Function} callback - Callback function
     */
    static off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Trigger all callbacks for an event
     * @private
     */
    static _triggerCallback(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Callback error in ${event}:`, e);
                }
            });
        }
    }

    /**
     * Get polling status
     */
    static getStatus() {
        return {
            isPolling: this.isPolling,
            interval: this.pollingInterval,
            failureCount: this.failureCount,
            lastDataHash: this.lastDataHash
        };
    }

    /**
     * Set polling interval
     * @param {number} interval - Interval in milliseconds
     */
    static setInterval(interval) {
        this.pollingInterval = interval;
        if (this.isPolling) {
            this.stopPolling();
            this.startPolling();
        }
    }
}
