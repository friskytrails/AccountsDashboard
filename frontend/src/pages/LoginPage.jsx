import { useState } from 'react';
import { Lock, ArrowRight, Eye, EyeOff, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Box, VStack, HStack, Heading, Text, Card } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(password.trim());
      if (res.success) {
        toast.success('Access granted. Welcome to Frisky Trails Accounts Dashboard!');
      } else {
        setError(res.error || 'Incorrect password');
        toast.error(res.error || 'Incorrect password');
      }
    } catch (err) {
      setError('An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden selection:bg-primary/20">
      {/* Background ambient lighting glows */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-primary/[0.06] rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-[700px] h-[700px] bg-emerald-500/[0.05] rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-[400px] h-[400px] bg-teal-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      <Card className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-card/90 backdrop-blur-2xl border border-border/80 shadow-2xl relative z-10 glow-card">
        {/* Brand Header */}
        <VStack space="md" className="items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white border border-border/70 shadow-xl shadow-primary/25 flex items-center justify-center p-1 mb-1">
            <img
              src="/logo.png"
              alt="Frisky Trails Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <VStack space="2xs">
            <Heading size="xl" bold className="text-foreground tracking-tight text-2xl font-bold">
              Frisky Trails
            </Heading>
            <Text size="xs" bold className="uppercase tracking-widest text-primary text-xs font-mono">
              Accounts Dashboard
            </Text>
          </VStack>
          <Text size="sm" className="text-muted-foreground text-xs leading-relaxed max-w-xs">
            Enter the authorization password to unlock the treasury and cash flow management dashboard.
          </Text>
        </VStack>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <VStack space="xs">
            <label className="text-xs font-semibold text-foreground/90 block">
              Access Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password..."
                autoFocus
                className="w-full pl-10 pr-11 py-3 bg-muted/30 border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <Text size="xs" className="text-rose-400 font-medium text-xs mt-1">
                {error}
              </Text>
            )}
          </VStack>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-primary hover:from-emerald-500 hover:to-emerald-400 text-primary-foreground font-bold text-sm rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50"
          >
            <span>Unlock Dashboard</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </Card>
    </Box>
  );
}
