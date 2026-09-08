import { Outlet, Link, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeftRight, Settings, ShieldCheck, Database, Zap, Plus } from 'lucide-react';
import { Box, VStack, HStack, Heading, Text, Avatar, AvatarFallbackText, Badge, BadgeText, BadgeIcon, Button, ButtonText, ButtonIcon } from '@/components/ui';
import MonthSelector from './MonthSelector';

export default function DashboardLayout({ selectedMonth, selectedYear, onMonthChange, onOpenAdd }) {
  const location = useLocation();

  const navItems = [
    { label: 'Cash Flow Dashboard', path: '/', icon: TrendingUp },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <Box className="min-h-screen bg-background text-foreground flex relative selection:bg-primary/20">
      {/* Background ambient lighting glows */}
      <div className="fixed top-0 left-64 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Sidebar */}
      <Box
        as="aside"
        className="w-64 bg-card/90 backdrop-blur-2xl border-r border-border/80 fixed left-0 top-0 bottom-0 flex flex-col z-30 shadow-2xl"
      >
        {/* Brand Header */}
        <Box className="p-6 border-b border-border/60">
          <HStack space="md" className="items-center">
            <Box className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/25 text-primary-foreground">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </Box>
            <VStack space="2xs">
              <Heading size="sm" bold className="text-foreground tracking-tight leading-none">
                FriskyTrails
              </Heading>
              <Text size="2xs" bold className="uppercase tracking-widest text-primary text-[10px]">
                Accounts Engine
              </Text>
            </VStack>
          </HStack>

          {/* Database Sync Status Badge */}
          <Box className="mt-4 p-2 bg-muted/40 border border-border/50 rounded-xl">
            <HStack space="sm" className="items-center justify-between">
              <HStack space="xs" className="items-center">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-sm shadow-primary" />
                <Text size="2xs" bold className="text-foreground/90 font-mono text-[10px]">
                  ft_booking_system
                </Text>
              </HStack>
              <Badge variant="success" size="sm" className="py-0 px-1.5 text-[9px]">
                <BadgeText>LIVE</BadgeText>
              </Badge>
            </HStack>
          </Box>
        </Box>

        {/* Navigation */}
        <Box as="nav" className="flex-1 p-4 overflow-y-auto">
          <VStack space="xs">
            <Box className="px-3 py-2">
              <Text size="2xs" bold className="uppercase tracking-widest text-muted-foreground text-[10px]">
                Platform Menu
              </Text>
            </Box>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-md shadow-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Text size="xs" bold={isActive} className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}>
                    {item.label}
                  </Text>
                </Link>
              );
            })}
          </VStack>
        </Box>

        {/* Bottom User Pill */}
        <Box className="p-4 border-t border-border/60 bg-muted/20">
          <HStack space="md" className="items-center p-2.5 rounded-xl bg-card/80 border border-border/60">
            <Avatar size="sm" className="bg-primary/20 text-primary border border-primary/30">
              <AvatarFallbackText className="text-primary font-bold text-xs">FA</AvatarFallbackText>
            </Avatar>
            <VStack space="2xs" className="flex-1 min-w-0">
              <Text size="xs" bold isTruncated className="text-foreground">
                Finance Admin
              </Text>
              <HStack space="xs" className="items-center">
                <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
                <Text size="2xs" className="text-muted-foreground font-medium text-[10px]">
                  Authorised Session
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </Box>
      </Box>

      {/* Main Container */}
      <Box className="ml-64 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Box
          as="header"
          className="sticky top-0 z-20 bg-card/80 backdrop-blur-2xl border-b border-border/70 px-8 py-4 flex items-center justify-between shadow-md"
        >
          <VStack space="2xs">
            <HStack space="sm" className="items-center">
              <Heading size="md" bold className="text-foreground tracking-tight">
                Cash Flow & Treasury Dashboard
              </Heading>
              <Badge variant="info" size="sm" className="gap-1">
                <BadgeIcon as={Zap} className="w-3 h-3 text-primary" />
                <BadgeText>Active Aggregation</BadgeText>
              </Badge>
            </HStack>
            <Text size="xs" className="text-muted-foreground">
              Automated booking inflows synchronized with manual operational cash flows
            </Text>
          </VStack>

          <HStack space="md" className="items-center">
            {/* Month & Year Filter */}
            <MonthSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onChange={onMonthChange}
            />
          </HStack>
        </Box>

        {/* Content Area */}
        <Box as="main" className="p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
