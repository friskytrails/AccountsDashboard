import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeftRight, ChevronLeft, Plus, LogOut } from 'lucide-react';
import { Box, VStack, HStack, Heading, Text } from '@/components/ui';
import { useAuth } from '../context/AuthContext';
import MonthSelector from './MonthSelector';
import AddTransactionModal from './AddTransactionModal';

export default function DashboardLayout({ selectedMonth, selectedYear, onMonthChange }) {
  const location = useLocation();
  const { logout } = useAuth() || {};
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('INFLOW');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenAdd = (type = 'INFLOW') => {
    setModalType(type);
    setShowAddModal(true);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const navItems = [
    { label: 'Cash Flow Dashboard', path: '/', icon: TrendingUp },
    { label: 'Transactions & Audit', path: '/transactions', icon: ArrowLeftRight, targetId: 'transactions-audit-section' },
  ];

  const handleNavClick = (e, item) => {
    if (item.targetId) {
      const el = document.getElementById(item.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Box className="min-h-screen bg-background text-foreground flex relative selection:bg-primary/20">
      {/* Background ambient lighting glows for a luxurious modern atmosphere */}
      <div className="fixed top-[-100px] left-80 w-[650px] h-[650px] bg-primary/[0.04] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[750px] h-[750px] bg-emerald-500/[0.03] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-1/4 w-[500px] h-[500px] bg-sky-500/[0.02] rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Silky Smooth Collapsible Executive Sidebar */}
      <Box
        as="aside"
        className={`sticky top-0 h-screen shrink-0 bg-card/95 backdrop-blur-2xl border-r border-border/80 flex flex-col z-30 shadow-2xl transition-[width] duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Brand Header & Toggle - Rock solid, never flips direction */}
        <Box className="border-b border-border/60 px-4 h-[76px] flex items-center justify-between overflow-hidden shrink-0">
          <HStack space="md" className="items-center min-w-0">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white border border-border/80 shadow-md shadow-primary/20 shrink-0 flex items-center justify-center p-0.5">
              <img
                src="/logo.png"
                alt="Frisky Trails Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <VStack
              space="2xs"
              className={`min-w-0 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                isCollapsed ? 'max-w-0 opacity-0 -translate-x-3 pointer-events-none' : 'max-w-[170px] opacity-100 translate-x-0'
              }`}
            >
              <Heading size="md" bold className="text-foreground tracking-tight leading-none text-base truncate">
                Frisky Trails
              </Heading>
              <Text size="2xs" bold className="uppercase tracking-widest text-primary text-[10px] font-mono truncate">
                Accounts Dashboard
              </Text>
            </VStack>
          </HStack>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </Box>

        {/* Add Manual Flow Action */}
        <Box className="p-3 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenAdd('INFLOW')}
            className={`w-full flex items-center justify-center rounded-md bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-500 hover:to-emerald-400 text-primary-foreground font-bold text-xs shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group overflow-hidden ${
              isCollapsed ? 'h-11 px-0' : 'h-11 px-4 gap-2.5'
            }`}
            aria-label="Add Manual Flow"
          >
            <Plus className="w-4 h-4 stroke-[3] transition-transform group-hover:rotate-90 shrink-0" />
            <span
              className={`tracking-wide font-bold transition-all duration-300 whitespace-nowrap overflow-hidden ${
                isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
              }`}
            >
              Add Manual Flow
            </span>
          </button>
        </Box>

        {/* Navigation Area */}
        <Box as="nav" className="flex-1 overflow-y-auto px-3 py-2">
          <VStack space="xs">
            <Box
              className={`px-2 py-1 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                isCollapsed ? 'max-w-0 opacity-0 h-0 p-0' : 'max-w-full opacity-100 h-auto'
              }`}
            >
              <Text size="2xs" bold className="uppercase tracking-widest text-muted-foreground/80 text-[10.5px]">
                Main Navigation
              </Text>
            </Box>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => handleNavClick(e, item)}
                  aria-label={item.label}
                  className={`flex items-center rounded-md text-xs font-semibold transition-all group overflow-hidden ${
                    isCollapsed ? 'h-11 px-3 justify-center' : 'px-3.5 py-3 gap-3.5'
                  } ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-lg shadow-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  <span
                    className={`min-w-0 text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ${
                      isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[180px] opacity-100 translate-x-0'
                    } ${isActive ? 'text-primary font-bold' : 'text-foreground/90 font-medium'}`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </VStack>
        </Box>
      </Box>

      {/* Main Content Area - Cleanly resizes without margin jumps */}
      <Box className="flex-1 flex flex-col min-w-0">
        {/* Top Executive Header */}
        <Box
          as="header"
          className="sticky top-0 z-20 bg-card/85 backdrop-blur-2xl border-b border-border/70 px-8 xl:px-12 py-5 flex items-center justify-between shadow-sm"
        >
          <VStack space="2xs">
            <Heading size="lg" bold className="text-foreground tracking-tight text-xl">
              Frisky Trails Accounts Dashboard
            </Heading>
          </VStack>

          <HStack space="md" className="items-center">
            {/* Month & Year Filter */}
            <MonthSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onChange={onMonthChange}
            />

            {logout && (
              <button
                type="button"
                onClick={logout}
                className="p-2.5 rounded-md border border-border/70 hover:border-destructive/50 bg-card hover:bg-destructive/10 text-muted-foreground hover:text-rose-400 transition-all cursor-pointer shadow-sm"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}
          </HStack>
        </Box>

        {/* Content Canvas */}
        <Box as="main" className="px-8 xl:px-12 py-10 flex-1 overflow-x-hidden">
          <Outlet context={{ handleOpenAdd, refreshKey }} />
        </Box>
      </Box>

      {/* Centralized Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        initialType={modalType}
      />
    </Box>
  );
}
