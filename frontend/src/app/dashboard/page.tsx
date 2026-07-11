"use client";

import Link from 'next/link';

export default function DashboardOverview() {
  // Mock data representing platform metrics
  const metrics = [
    {
      title: 'Total Codes Reviewed',
      value: '24',
      description: 'Across all active projects',
      trend: '+12% this week',
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'Remaining Credits',
      value: '4 / 5',
      description: 'Resets dynamically next month',
      trend: '1 credit consumed',
      icon: (
        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Average Quality Score',
      value: '84.6%',
      description: 'Based on last 10 submissions',
      trend: 'Good (Grade B+)',
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  // Mock data representing historical activity list
  const recentActivity = [
    {
      id: 'act_1',
      projectName: 'ReviewPulse API',
      fileName: 'authController.ts',
      language: 'TypeScript',
      score: 92,
      vulnerabilities: 0,
      status: 'Clean',
      date: '2 hours ago',
    },
    {
      id: 'act_2',
      projectName: 'CodePulse Client',
      fileName: 'sync-user.tsx',
      language: 'TypeScript',
      score: 78,
      vulnerabilities: 2,
      status: 'Action Required',
      date: '1 day ago',
    },
    {
      id: 'act_3',
      projectName: 'Supabase Adapter',
      fileName: 'db_connection.js',
      language: 'JavaScript',
      score: 84,
      vulnerabilities: 1,
      status: 'Warning',
      date: '3 days ago',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Dynamic Welcome Heading */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Overview Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">
            Welcome to CodePulse AI! Review your coding metrics and track recent project submissions.
          </p>
        </div>
        <Link
          href="/dashboard/new-review"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Code Review
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((m) => (
          <div
            key={m.title}
            className="group relative rounded-2xl border border-slate-900 bg-slate-900/10 p-6 hover:bg-slate-900/20 hover:border-slate-800 transition-all duration-300 shadow-md backdrop-blur-md"
          >
            {/* Visual background card glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-transparent to-transparent opacity-50 rounded-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{m.title}</p>
                <h3 className="text-3xl font-extrabold text-white mt-3 group-hover:scale-105 transition-transform duration-300 origin-left">
                  {m.value}
                </h3>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl">
                {m.icon}
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-slate-900/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">{m.description}</span>
              <span className={`font-semibold ${
                m.title === 'Remaining Credits' ? 'text-amber-400' : m.title === 'Total Codes Reviewed' ? 'text-blue-400' : 'text-emerald-400'
              }`}>
                {m.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table Card */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-950/20">
          <h3 className="text-md font-bold text-white tracking-wide">Recent Code Reviews</h3>
          <Link href="/dashboard/history" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
            View All History &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-slate-400 uppercase tracking-wider border-b border-slate-900/80 text-[10px] font-semibold">
                <th className="py-4 px-6">Project Name</th>
                <th className="py-4 px-6">File Name</th>
                <th className="py-4 px-6">Language</th>
                <th className="py-4 px-6 text-center">Quality Score</th>
                <th className="py-4 px-6 text-center">Vulnerabilities</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {recentActivity.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-slate-900/20 transition-colors text-slate-300 font-medium"
                >
                  <td className="py-4.5 px-6 font-semibold text-white">{a.projectName}</td>
                  <td className="py-4.5 px-6 font-mono text-slate-400">{a.fileName}</td>
                  <td className="py-4.5 px-6">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                      {a.language}
                    </span>
                  </td>
                  <td className="py-4.5 px-6 text-center font-bold">
                    <span className={a.score >= 90 ? 'text-emerald-400' : a.score >= 80 ? 'text-blue-400' : 'text-amber-400'}>
                      {a.score}%
                    </span>
                  </td>
                  <td className="py-4.5 px-6 text-center font-bold font-mono">
                    <span className={a.vulnerabilities > 0 ? 'text-rose-400' : 'text-slate-500'}>
                      {a.vulnerabilities}
                    </span>
                  </td>
                  <td className="py-4.5 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      a.status === 'Clean'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : a.status === 'Warning'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        a.status === 'Clean' ? 'bg-emerald-400' : a.status === 'Warning' ? 'bg-amber-400' : 'bg-rose-400'
                      }`} />
                      {a.status}
                    </span>
                  </td>
                  <td className="py-4.5 px-6 text-right text-slate-500">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
