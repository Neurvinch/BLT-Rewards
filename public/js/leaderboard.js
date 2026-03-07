// Leaderboard initialization and wiring
document.addEventListener('DOMContentLoaded', () => {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = btn.getAttribute('data-tab');
            UIRenderer.switchTab(tab);
        });
    });

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));

    document.getElementById('tx-prev-page').addEventListener('click', () => changeTxPage(-1));
    document.getElementById('tx-next-page').addEventListener('click', () => changeTxPage(1));

    // Controls
    document.getElementById('search-btn').addEventListener('click', () => loadAndRender(1));
    document.getElementById('refresh-btn').addEventListener('click', async () => {
        UIRenderer.showRefreshIndicator();
        try {
            await RealTimeUpdater.poll();
        } finally {
            UIRenderer.hideRefreshIndicator();
        }
    });

    // Wire RealTimeUpdater events
    RealTimeUpdater.on('onUpdate', ({leaderboard, metrics, transactions, timestamp}) => {
        try {
            UIRenderer.updateHeaderStats(metrics);
            const stats = DataProcessor.calculateStatistics(leaderboard);
            UIRenderer.updateChartStatistics(stats);
            // Initialize charts with fresh data
            ChartRenderer.initDistributionChart(leaderboard);
            ChartRenderer.initTopContributorsChart(leaderboard);
            ChartRenderer.initTierDistributionChart(stats);
            // Default sort and paginate
            currentLeaderboard = DataProcessor.sortContributors(leaderboard, currentSortBy);
            const pageResult = DataProcessor.paginate(currentLeaderboard, currentPage, currentLimit);
            UIRenderer.renderLeaderboardTable(pageResult.items);
            UIRenderer.updatePagination(pageResult);
            UIRenderer.renderTransactionsList(transactions);
            UIRenderer.updateTransactionPagination({page: txPage, totalPages: Math.ceil(transactions.length / txLimit), total: transactions.length, hasMore: txPage < Math.ceil(transactions.length / txLimit), hasPrevious: txPage > 1});
            UIRenderer.updateLastUpdated(timestamp);
        } catch (e) {
            console.error('Render error:', e);
            UIRenderer.showErrorState();
        }
    });

    RealTimeUpdater.on('onError', ({error}) => {
        console.warn('Realtime error:', error);
        UIRenderer.showErrorState();
    });

    // Start
    RealTimeUpdater.startPolling();

    // Initial load
    loadAndRender(1).catch(err => {
        console.error('Initial load failed:', err);
        UIRenderer.showErrorState();
    });
});

// Simple state
let currentPage = 1;
let currentLimit = parseInt(document.getElementById('limit-select')?.value || '100', 10);
let currentSortBy = document.getElementById('ranking-select')?.value || 'bacon';
let currentLeaderboard = [];

let txPage = 1;
const txLimit = 20;

async function loadAndRender(page = 1) {
    currentPage = page;
    currentLimit = parseInt(document.getElementById('limit-select').value, 10) || 100;
    currentSortBy = document.getElementById('ranking-select').value || 'bacon';

    UIRenderer.showLoadingState();

    const [rawLeaderboard, rawMetrics, rawTx] = await Promise.all([
        APIClient.getLeaderboard(currentSortBy, 100, 0),
        APIClient.getMetrics(),
        APIClient.getTransactions(txLimit, 0)
    ]);

    const leaderboard = DataProcessor.normalizeLeaderboardData(rawLeaderboard);
    const metrics = DataProcessor.normalizeMetrics(rawMetrics);
    const transactions = DataProcessor.normalizeTransactions(rawTx);

    currentLeaderboard = DataProcessor.sortContributors(leaderboard, currentSortBy);
    const pageResult = DataProcessor.paginate(currentLeaderboard, currentPage, currentLimit);

    UIRenderer.updateHeaderStats(metrics);
    UIRenderer.renderLeaderboardTable(pageResult.items);
    UIRenderer.updatePagination(pageResult);
    UIRenderer.renderTransactionsList(transactions);
    UIRenderer.updateTransactionPagination({page: txPage, totalPages: Math.ceil(transactions.length / txLimit), total: transactions.length, hasMore: txPage < Math.ceil(transactions.length / txLimit), hasPrevious: txPage > 1});
}

function changePage(delta) {
    const totalPages = Math.ceil(currentLeaderboard.length / currentLimit) || 1;
    let next = currentPage + delta;
    if (next < 1) next = 1;
    if (next > totalPages) next = totalPages;
    if (next === currentPage) return;
    loadAndRender(next);
}

function changeTxPage(delta) {
    // Simple client-side pagination for transactions cached from last fetch
    txPage = Math.max(1, txPage + delta);
    // Re-render transactions if storage present
    APIClient.getTransactions(txLimit, (txPage - 1) * txLimit).then(raw => {
        const tx = DataProcessor.normalizeTransactions(raw);
        UIRenderer.renderTransactionsList(tx);
        UIRenderer.updateTransactionPagination({page: txPage, totalPages: Math.ceil(tx.length / txLimit), total: tx.length, hasMore: txPage < Math.ceil(tx.length / txLimit), hasPrevious: txPage > 1});
    }).catch(err => {
        console.error('Tx page change failed:', err);
    });
}

export {};
