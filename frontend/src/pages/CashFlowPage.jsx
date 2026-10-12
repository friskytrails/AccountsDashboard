import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';
import { Box, VStack } from '@/components/ui';
import KpiCards from '../components/KpiCards';
import CashFlowChart from '../components/CashFlowChart';
import DonutChart from '../components/DonutChart';
import ExpenseCategories from '../components/ExpenseCategories';
import RecentTransactions from '../components/RecentTransactions';

export default function CashFlowPage({ selectedMonth, selectedYear }) {
  const { handleOpenAdd, refreshKey } = useOutletContext() || {};
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [liveInflows, setLiveInflows] = useState([]);
  const [liveOutflows, setLiveOutflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, txData, liveInflowsData, liveOutflowsData] = await Promise.all([
        apiFetch(`/dashboard/summary?month=${selectedMonth}&year=${selectedYear}`),
        apiFetch(`/transactions?month=${selectedMonth}&year=${selectedYear}&limit=50`),
        apiFetch(`/transactions/live-inflows?month=${selectedMonth}&year=${selectedYear}`),
        apiFetch(`/transactions/live-outflows?month=${selectedMonth}&year=${selectedYear}`)
      ]);

      setSummary(summaryData);
      setTransactions(txData.transactions || []);
      setLiveInflows(liveInflowsData.inflows || []);
      setLiveOutflows(liveOutflowsData.outflows || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Could not load financial data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  useEffect(() => {
    if (location.pathname === '/transactions') {
      const timer = setTimeout(() => {
        const el = document.getElementById('transactions-audit-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  async function handleDeleteTransaction(id) {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      toast.success('Transaction record removed from ledger');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Could not delete transaction');
    }
  }

  return (
    <VStack space="2xl" className="max-w-[1680px] w-full mx-auto space-y-10">
      {/* Row 1: Grand Executive KPI Cards */}
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

      {/* Row 2: Full-Width Majestic Daily Cash Flow Velocity Visualization */}
      <CashFlowChart dailyTrend={summary?.dailyTrend || []} loading={loading} />


      {/* Row 4: Two-Column Dedicated Operational & Ledger Workspace */}
      <Box id="transactions-audit-section" className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start scroll-mt-28">
        {/* Left Column (7 cols): Full-Featured Audit & Transaction Ledger */}
        <Box className="xl:col-span-7">
          <RecentTransactions
            transactions={transactions}
            liveInflows={liveInflows}
            liveOutflows={liveOutflows}
            onOpenAdd={() => (handleOpenAdd ? handleOpenAdd('OUTFLOW') : null)}
            onDelete={handleDeleteTransaction}
            loading={loading}
          />
        </Box>

        {/* Right Column (5 cols): Capital Distribution & Expense Allocation */}
        <Box className="xl:col-span-5">
          <VStack space="xl" className="space-y-8">
            <DonutChart
              categoryBreakdown={summary?.categoryBreakdown || []}
              totalOutflow={summary?.totalOutflow || 0}
              loading={loading}
              onOpenAdd={() => (handleOpenAdd ? handleOpenAdd('OUTFLOW') : null)}
            />

            <ExpenseCategories
              categoryBreakdown={summary?.categoryBreakdown || []}
              totalOutflow={summary?.totalOutflow || 0}
              loading={loading}
              onOpenAdd={() => (handleOpenAdd ? handleOpenAdd('OUTFLOW') : null)}
            />
          </VStack>
        </Box>
      </Box>
    </VStack>
  );
}
