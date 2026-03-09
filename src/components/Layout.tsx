import { Link, useLocation } from 'react-router-dom';
import { Fish, Trophy, Home, Plus, Wallet, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/competitions', icon: Trophy, label: 'Wedstrijden' },
  { to: '/competitions/new', icon: Plus, label: 'Nieuw' },
  { to: '/fish-fund', icon: Wallet, label: 'Visfonds' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Fish className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight font-display">
              VisWedstrijd
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to || 
                (to !== '/' && location.pathname.startsWith(to) && to !== '/competitions/new');
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-primary/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Extra item voor aanmeldingen (alleen zichtbaar voor ingelogde gebruikers) */}
            {user && (
              <Link
                to="/admin/aanmeldingen"
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/admin/aanmeldingen'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Aanmeldingen</span>
                {location.pathname === '/admin/aanmeldingen' && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </Link>
            )}
          </nav>

          {/* Gebruikersinfo */}
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:inline">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <span className="sr-only">Uitloggen</span>
                <span className="hidden sm:inline">Uitloggen</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="container py-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
