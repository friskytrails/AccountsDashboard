import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';
import { Box, VStack } from '@/components/ui';
import KpiCards from '../components/KpiCards';
import CashFlowChart from '../components/CashFlowChart';
import CashSummary from '../components/CashSummary';
import DonutChart from '../components/DonutChart';
import ExpenseCategories from '../components/ExpenseCategories';
import RecentTransactions from '../components/RecentTransactions';
import AddTransactionModal from '../components/AddTransactionModal';

export default function CashFlowPage({ selectedMonth, selectedYear }) {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, txData] = await Promise.all([
        apiFetch(`/dashboard/summary?month=${selectedMonth}&year=${selectedYear}`),
        apiFetch(`/transactions?month=${selectedMonth}&year=${selectedYear}&limit=10`)
      ]);

      setSummary(summaryData);
      setTransactions(txData.transactions || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Could not load financial data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDeleteTransaction(id) {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      toast.success('Transaction removed');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Could not delete transaction');
    }
  }

  return (
    <VStack space="xl" className="max-w-7xl mx-auto">
      {/* Row 1: KPI Cards */}
      <KpiCards
        totalInflow={summary?.totalInflow || 0}
        totalOutflow={summary?.totalOutflow || 0}
        netCashFlow={summary?.netCashFlow || 0}
        closingBalance={summary?.closingBalance || 0}
        changes={summary?.changes || {}}
        month={selectedMonth}
        year={selectedYear}
        loading={loading}
      />

      {/* Row 2: Daily Chart (65%) & Cash Statement (35%) */}
      <Box className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Box className="lg:col-span-8">
          <CashFlowChart dailyTrend={summary?.dailyTrend || []} loading={loading} />
        </Box>
        <Box className="lg:col-span-4">
          <CashSummary
            openingBalance={summary?.openingBalance || 0}
            totalInflow={summary?.totalInflow || 0}
            totalOutflow={summary?.totalOutflow || 0}
            closingBalance={summary?.closingBalance || 0}
            month={selectedMonth}
            year={selectedYear}
            loading={loading}
          />
        </Box>
      </Box>

      {/* Row 3: Donut Chart, Expense Categories, Recent Transactions */}
      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
        <Box className="lg:col-span-4">
          <DonutChart
            totalInflow={summary?.totalInflow || 0}
            totalOutflow={summary?.totalOutflow || 0}
            loading={loading}
          />
        </Box>

        <Box className="lg:col-span-4">
          <ExpenseCategories
            categoryBreakdown={summary?.categoryBreakdown || []}
            totalOutflow={summary?.totalOutflow || 0}
            loading={loading}
            onOpenAdd={() => setShowAddModal(true)}
          />
        </Box>

        <Box className="lg:col-span-4">
          <RecentTransactions
            transactions={transactions}
            onOpenAdd={() => setShowAddModal(true)}
            onDelete={handleDeleteTransaction}
            loading={loading}
          />
        </Box>
      </Box>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </VStack>
  );
}
