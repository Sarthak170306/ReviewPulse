"use client";

import { useState } from 'react';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
      case '/dashboard/rules':
        return 'SAST Rules';
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
      name: 'SAST Rules',
      path: '/dashboard/rules',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
    <div className="flex h-screen w-screen bg-[#030712] overflow-hidden text-slate-100 font-sans print:bg-white print:text-black print:h-auto print:overflow-visible">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none print:hidden" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none print:hidden" />

      <SyncUser />

      {/* Sidebar Panel Container */}
      <aside className={`flex flex-col bg-[#090d16] border-r border-slate-800/80 h-full transition-all duration-300 ease-in-out print:hidden z-20 ${isSidebarCollapsed ? 'w-0 opacity-0 -translate-x-full' : 'w-64 opacity-100 translate-x-0'}`}>
        <div className="h-16 border-b border-slate-800 flex items-center px-6 gap-2 shrink-0">
          <svg className="w-6 h-6 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-bold text-lg text-white whitespace-nowrap">
            CodePulse <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI</span>
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
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
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#090d16]/40 shrink-0">
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <span>Client v1.0.0</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Connected
            </span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Container Layer */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 print:overflow-visible print:h-auto print:w-full print:bg-white print:text-black">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-[#030712]/50 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            {/* Minimalist Floating Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center select-none"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg 
                className={`w-4 h-4 transform transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">dashboard</span>
              <span className="text-xs text-slate-700">/</span>
              <h1 className="text-sm font-semibold text-slate-300 tracking-wide font-mono uppercase">
                {getHeaderTitle()}
              </h1>
            </div>
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

        {/* Main Content View with Custom Scrolling */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#030712] relative print:p-0 print:bg-white print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}