import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { Filter, X, Check, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';
import { Box, VStack, HStack, Heading, Text, Badge, BadgeText, Button, ButtonText } from '@/components/ui';
import KpiCards from '../components/KpiCards';
import CashFlowChart from '../components/CashFlowChart';
import DonutChart from '../components/DonutChart';
import ExpenseCategories from '../components/ExpenseCategories';
import RecentTransactions from '../components/RecentTransactions';

const SIX_ACCOUNTS = [
  'Kalpana BOI',
  'Kalpana PNB',
  'Babita AU',
  'Hari Mohan BOB',
  'FT HDFC',
  'Pratyush SBI'
];

export default function CashFlowPage({ selectedMonth, selectedYear }) {
  const { handleOpenAdd, refreshKey } = useOutletContext() || {};
  const location = useLocation();
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [liveInflows, setLiveInflows] = useState([]);
  const [liveOutflows, setLiveOutflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const accountParam =
        selectedAccount !== 'ALL' && selectedAccount !== 'ACCOUNT_WISE'
          ? `&account=${encodeURIComponent(selectedAccount)}`
          : '';

      const [summaryData, txData, liveInflowsData, liveOutflowsData] = await Promise.all([
        apiFetch(`/dashboard/summary?month=${selectedMonth}&year=${selectedYear}${accountParam}`),
        apiFetch(`/transactions?month=${selectedMonth}&year=${selectedYear}&limit=50${accountParam}`),
        apiFetch(`/transactions/live-inflows?month=${selectedMonth}&year=${selectedYear}${accountParam}`),
        apiFetch(`/transactions/live-outflows?month=${selectedMonth}&year=${selectedYear}${accountParam}`)
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
  }, [selectedMonth, selectedYear, selectedAccount]);

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

  const handleAccountFilterClick = (acc) => {
    setSelectedAccount(acc);
  };

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
    <VStack space="2xl" className="max-w-[1680px] w-full mx-auto space-y-9">
      {/* ── REQUIREMENT 6: ACCOUNT-WISE EXECUTIVE FILTER STRIP ON MAIN PAGE ── */}
      <Box className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shadow-sm">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-primary block">
                Filter by Account
              </span>
              <p className="text-xs text-muted-foreground">
                View all accounts together or choose a specific bank account
              </p>
            </div>
          </div>

          {selectedAccount !== 'ALL' && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 py-1 px-3 rounded-lg self-start md:self-auto">
              <span className="text-xs text-foreground font-semibold">
                Filtering by: <strong className="text-primary">{selectedAccount}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedAccount('ALL')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold ml-1 cursor-pointer"
                title="Reset to All Accounts"
              >
                <X className="w-3.5 h-3.5" />
                <span>Show All</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Buttons Rail */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap pt-1">
          {/* All Accounts Option */}
          <button
            type="button"
            onClick={() => handleAccountFilterClick('ALL')}
            className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
              selectedAccount === 'ALL'
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 font-bold'
                : 'bg-muted/30 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Accounts (Overview)</span>
          </button>

          {/* The 6 Individual Accounts */}
          {SIX_ACCOUNTS.map((acc) => {
            const isSelected = selectedAccount === acc;
            return (
              <button
                key={acc}
                type="button"
                onClick={() => handleAccountFilterClick(acc)}
                className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-primary/20 text-primary border-primary shadow-sm shadow-primary/25 font-bold ring-1 ring-primary/40'
                    : 'bg-muted/20 hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{acc}</span>
                {isSelected && <Check className="w-3 h-3 text-primary" />}
              </button>
            );
          })}
        </div>
      </Box>

      {/* Row 1: Grand Executive KPI Cards (Updated with selected account figures) */}
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
              categoryBreakdown={summary?.expenseAllocationBreakdown || []}
              totalOutflow={summary?.totalExpenseAllocation || 0}
              loading={loading}
              onOpenAdd={() => (handleOpenAdd ? handleOpenAdd('OUTFLOW') : null)}
            />
          </VStack>
        </Box>
      </Box>
    </VStack>
  );
}
