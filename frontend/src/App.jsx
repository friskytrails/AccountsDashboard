import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GluestackUIProvider } from '@/components/ui';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import CashFlowPage from './pages/CashFlowPage';

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState(9); // September 2026 (active bookings data)
  const [selectedYear, setSelectedYear] = useState(2026);

  const handleMonthChange = (m, y) => {
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  return (
    <GluestackUIProvider colorMode="dark">
      <AuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgb(23 23 23)',
                color: 'rgb(250 250 250)',
                border: '1px solid rgb(46 46 46)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem'
              }
            }}
          />
          <Routes>
            <Route
              element={
                <DashboardLayout
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthChange={handleMonthChange}
                />
              }
            >
              <Route
                path="/"
                element={
                  <CashFlowPage
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                }
              />
              {/* Fallback & other nav links redirect to dashboard */}
              <Route
                path="/transactions"
                element={
                  <CashFlowPage
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </GluestackUIProvider>
  );
}
