"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import SyncUser from './sync-user';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  const getHeaderTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Overview';
      case '/dashboard/new-review':
        return 'New Review';
      case '/dashboard/history':
        return 'History';
      case '/dashboard/account':
        return 'Account';
      default:
        return 'Dashboard';
    }
  };

  const navItems = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: 'New Review',
      path: '/dashboard/new-review',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'History',
      path: '/dashboard/history',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Account',
      path: '/dashboard/account',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

      <SyncUser />

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/70 backdrop-blur-xl flex flex-col z-20">
        <div className="h-16 border-b border-slate-900 flex items-center px-6 gap-2">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-bold text-lg text-white">
            CodePulse <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${
                  active
                    ? 'text-white bg-slate-900/60 border border-slate-800 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-md" />
                )}
                <span className={`transition-colors duration-300 ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900 bg-slate-950/40">
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <span>Client v1.0.0</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Connected
            </span>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">dashboard</span>
            <span className="text-xs text-slate-700">/</span>
            <h1 className="text-sm font-semibold text-slate-300 tracking-wide font-mono uppercase">
              {getHeaderTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              API Server Live
            </div>
            
            <UserButton 
              appearance={{
                baseTheme: dark,
                variables: {
                  colorPrimary: '#3b82f6'
                }
              } as any}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-950 relative">
          {children}
        </main>
      </div>
    </div>
  );
}