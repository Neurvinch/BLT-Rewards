// Data Processor - Transforms and normalizes blockchain data
class DataProcessor {
    // Tier definitions
    static TIERS = {
        CONTRIBUTOR: { name: 'Contributor', min: 10, max: 99, color: '#3B82F6', class: 'badge-contributor' },
        CHAMPION: { name: 'Champion', min: 100, max: 499, color: '#E10101', class: 'badge-champion' },
        HERO: { name: 'Hero', min: 500, max: 999, color: '#9945ff', class: 'badge-hero' },
        LEGEND: { name: 'Legend', min: 1000, max: Infinity, color: '#F59E0B', class: 'badge-legend' }
    };

    /**
     * Calculate tier based on total BACON amount
     * @param {number} baconAmount - Total BACON earned
     * @returns {Object} Tier object
     */
    static calculateTier(baconAmount) {
        if (baconAmount >= this.TIERS.LEGEND.min) return this.TIERS.LEGEND;
        if (baconAmount >= this.TIERS.HERO.min) return this.TIERS.HERO;
        if (baconAmount >= this.TIERS.CHAMPION.min) return this.TIERS.CHAMPION;
        if (baconAmount >= this.TIERS.CONTRIBUTOR.min) return this.TIERS.CONTRIBUTOR;
        return { name: 'Newcomer', min: 0, max: 9, color: '#6B7280', class: 'badge-newcomer' };
    }

    /**
     * Normalize leaderboard response data
     * @param {Object} rawData - Raw API response
     * @returns {Array} Normalized contributor array
     */
    static normalizeLeaderboardData(rawData) {
        if (!rawData || !rawData.data) {
            return [];
        }

        return rawData.data.map((contributor, index) => ({
            rank: contributor.rank || (index + 1),
            username: contributor.username || 'Unknown',
            wallet: contributor.wallet || '',
            totalBacon: contributor.total_bacon || 0,
            prCount: contributor.pr_count || 0,
            avgValue: contributor.avg_value || 0,
            lastRewarded: contributor.last_rewarded || null,
            tier: this.calculateTier(contributor.total_bacon || 0)
        }));
    }

    /**
     * Normalize metrics response
     * @param {Object} rawMetrics - Raw metrics API response
     * @returns {Object} Normalized metrics
     */
    static normalizeMetrics(rawMetrics) {
        if (!rawMetrics) {
            return {
                totalBaconDistributed: 0,
                totalActiveContributors: 0,
                avgRewardPerContributor: 0,
                recentTransaction: null
            };
        }

        return {
            totalBaconDistributed: rawMetrics.total_bacon_distributed || 0,
            totalActiveContributors: rawMetrics.total_active_contributors || 0,
            avgRewardPerContributor: rawMetrics.avg_reward_per_contributor || 0,
            recentTransaction: rawMetrics.recent_transaction || null
        };
    }

    /**
     * Normalize transaction data
     * @param {Object} rawTransactions - Raw transaction API response
     * @returns {Array} Normalized transactions
     */
    static normalizeTransactions(rawTransactions) {
        if (!rawTransactions || !rawTransactions.transactions) {
            return [];
        }

        return rawTransactions.transactions.map(tx => ({
            signature: tx.signature || '',
            username: tx.username || 'Unknown',
            amount: tx.amount || 0,
            timestamp: tx.timestamp || new Date().toISOString(),
            explorerUrl: tx.explorer_url || '',
            getInitials: function() {
                return this.username
                    .split(/[-_.]/)
                    .slice(0, 2)
                    .map(part => part[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
            },
            getTimeAgo: function() {
                return DataProcessor.formatTimeAgo(new Date(this.timestamp));
            }
        }));
    }

    /**
     * Sort contributors by different metrics
     * @param {Array} contributors - Array of contributors
     * @param {string} sortBy - 'bacon', 'pr-count', or 'avg-value'
     * @returns {Array} Sorted contributors
     */
    static sortContributors(contributors, sortBy = 'bacon') {
        const copy = [...contributors];

        switch (sortBy) {
            case 'bacon':
                return copy.sort((a, b) => b.totalBacon - a.totalBacon);
            case 'pr-count':
                return copy.sort((a, b) => b.prCount - a.prCount);
            case 'avg-value':
                return copy.sort((a, b) => b.avgValue - a.avgValue);
            default:
                return copy;
        }
    }

    /**
     * Calculate additional statistics from leaderboard
     * @param {Array} contributors - Array of contributors
     * @returns {Object} Statistics
     */
    static calculateStatistics(contributors) {
        if (contributors.length === 0) {
            return {
                totalBacon: 0,
                avgPerContributor: 0,
                medianBacon: 0,
                highestTier: 'Newcomer',
                topContributor: null,
                tierDistribution: {}
            };
        }

        const totalBacon = contributors.reduce((sum, c) => sum + (c.totalBacon || 0), 0);
        const sorted = [...contributors].sort((a, b) => b.totalBacon - a.totalBacon);
        const median = sorted[Math.floor(sorted.length / 2)]?.totalBacon || 0;

        // Tier distribution
        const tierDistribution = {};
        Object.values(this.TIERS).forEach(tier => {
            tierDistribution[tier.name] = contributors.filter(
                c => c.totalBacon >= tier.min && c.totalBacon <= tier.max
            ).length;
        });

        return {
            totalBacon: totalBacon,
            avgPerContributor: Math.round(totalBacon / contributors.length),
            medianBacon: median,
            highestTier: sorted[0]?.tier.name || 'Newcomer',
            topContributor: sorted[0] || null,
            tierDistribution: tierDistribution,
            totalContributors: contributors.length
        };
    }

    /**
     * Format timestamp as relative time (e.g., "5 minutes ago")
     * @param {Date} date - Date to format
     * @returns {string} Relative time string
     */
    static formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return `${Math.floor(seconds / 604800)} weeks ago`;
    }

    /**
     * Truncate wallet address for display
     * @param {string} wallet - Full wallet address
     * @param {number} startChars - Characters to show from start
     * @param {number} endChars - Characters to show from end
     * @returns {string} Truncated address
     */
    static truncateWallet(wallet, startChars = 8, endChars = 4) {
        if (!wallet || wallet.length < startChars + endChars) {
            return wallet;
        }
        return `${wallet.substring(0, startChars)}...${wallet.substring(wallet.length - endChars)}`;
    }

    /**
     * Format large numbers with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Hash data to detect changes
     * @param {*} data - Data to hash
     * @returns {number} Hash value
     */
    static hashData(data) {
        const str = JSON.stringify(data);
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash);
    }

    /**
     * Paginate array
     * @param {Array} items - Items to paginate
     * @param {number} page - Page number (1-indexed)
     * @param {number} pageSize - Items per page
     * @returns {Object} Pagination result
     */
    static paginate(items, page = 1, pageSize = 25) {
        const total = items.length;
        const totalPages = Math.ceil(total / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageItems = items.slice(startIndex, endIndex);

        return {
            items: pageItems,
            page: page,
            pageSize: pageSize,
            total: total,
            totalPages: totalPages,
            hasMore: page < totalPages,
            hasPrevious: page > 1
        };
    }
}
