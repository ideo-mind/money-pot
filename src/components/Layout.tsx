import { Link, Outlet } from "react-router-dom";
import { UnifiedWalletConnectButton } from "./UnifiedWalletConnectButton";
import { BalanceDisplay } from "./BalanceDisplay";
import { TransactionLog } from "./TransactionLog";
import logoImage from "/logo.png";
export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <img src={logoImage} alt="Money Pot Logo" className="w-8 h-8 group-hover:animate-pulse" loading="lazy" />
              <span className="text-2xl font-display font-bold text-slate-900 dark:text-slate-50">
                Money Pot
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link to="/pots" className="text-slate-600 dark:text-slate-300 hover:text-brand-green dark:hover:text-brand-green transition-colors">
                Browse Pots
              </Link>
              <Link to="/create" className="text-slate-600 dark:text-slate-300 hover:text-brand-green dark:hover:text-brand-green transition-colors">
                Create a Pot
              </Link>
              <Link to="/leaderboard" className="text-slate-600 dark:text-slate-300 hover:text-brand-green dark:hover:text-brand-green transition-colors">
                Leaderboard
              </Link>
              <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-brand-green dark:hover:text-brand-green transition-colors">
                Dashboard
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <BalanceDisplay />
              <UnifiedWalletConnectButton />
            </div>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="bg-background border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>© 2025 Money Pot. All rights reserved.</p>
        </div>
      </footer>
      <TransactionLog />
    </div>
  );
}