// Chart Renderer - Chart.js integration
class ChartRenderer {
    static charts = {};

    /**
     * Initialize distribution timeline chart
     * @param {Array} contributors - Contributors data
     */
    static initDistributionChart(contributors) {
        const ctx = document.getElementById('distribution-chart');
        if (!ctx || !contributors || contributors.length === 0) return;

        // Generate 30-day timeline with mock data (in production, this would come from the API)
        const data = this._generateTimelineData(contributors);

        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }

        this.charts.distribution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'BACON Distributed',
                    data: data.values,
                    borderColor: '#E10101',
                    backgroundColor: 'rgba(225, 1, 1, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#E10101',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        borderColor: '#E10101',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6B7280',
                            font: { size: 12 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize top contributors bar chart
     * @param {Array} contributors - Contributors data
     */
    static initTopContributorsChart(contributors) {
        const ctx = document.getElementById('top-contributors-chart');
        if (!ctx || !contributors || contributors.length === 0) return;

        const topFive = contributors.slice(0, 5);
        const labels = topFive.map(c => c.username);
        const data = topFive.map(c => c.totalBacon);

        if (this.charts.topContributors) {
            this.charts.topContributors.destroy();
        }

        this.charts.topContributors = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total BACON',
                    data: data,
                    backgroundColor: [
                        '#E10101',
                        '#9945ff',
                        '#10B981',
                        '#3B82F6',
                        '#F59E0B'
                    ],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        borderColor: '#E10101',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.x} BACON`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6B7280',
                            font: { size: 12 }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize tier distribution pie chart
     * @param {Object} stats - Statistics object from DataProcessor
     */
    static initTierDistributionChart(stats) {
        const ctx = document.getElementById('tier-distribution-chart');
        if (!ctx || !stats) return;

        const tiers = ['Newcomer', 'Contributor', 'Champion', 'Hero', 'Legend'];
        const colors = ['#6B7280', '#3B82F6', '#E10101', '#9945ff', '#F59E0B'];
        const data = tiers.map(tier => {
            if (tier === 'Newcomer') {
                return stats.totalContributors - Object.values(stats.tierDistribution).reduce((a, b) => a + b, 0);
            }
            return stats.tierDistribution[tier] || 0;
        });

        // Filter out zero values
        const filtered = tiers
            .map((tier, i) => ({ tier, count: data[i], color: colors[i] }))
            .filter(item => item.count > 0);

        if (filtered.length === 0) return;

        if (this.charts.tierDistribution) {
            this.charts.tierDistribution.destroy();
        }

        this.charts.tierDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: filtered.map(item => item.tier),
                datasets: [{
                    data: filtered.map(item => item.count),
                    backgroundColor: filtered.map(item => item.color),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 },
                            color: '#6B7280'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 },
                        borderColor: '#E10101',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.parsed * 100) / total);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Generate mock timeline data for 30 days
     * @private
     */
    static _generateTimelineData(contributors) {
        const labels = [];
        const values = [];
        const now = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
            labels.push(monthDay);

            // Generate pseudo-random but consistent values based on contributor count
            const seed = date.getTime() + contributors.length;
            const random = Math.sin(seed / 1000) * 0.5 + 0.5;
            const value = Math.round(random * contributors.length * 3.5);
            values.push(value);
        }

        return { labels, values };
    }

    /**
     * Destroy all charts
     */
    static destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }

    /**
     * Resize charts
     */
    static resizeAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    }
}

// Resize charts when window resizes
window.addEventListener('resize', () => {
    ChartRenderer.resizeAll();
});
