"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface ProjectItem {
  id: string;
  user_id: string;
  project_name: string;
  created_at: string;
  overall_score?: number | null;
  vulnerability_count?: number | null;
}

export default function DashboardOverview() {
  const { user, isLoaded } = useUser();
  
  const [credits, setCredits] = useState<number | null>(null);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorFetch, setErrorFetch] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      setLoading(true);
      setErrorFetch(false);

      const fetchDashboardData = async () => {
        try {
          // Fetch user profile (credits)
          const profileRes = await fetch(`http://localhost:5000/api/users/profile/${user.id}`);
          if (!profileRes.ok) throw new Error("Profile fetch failed");
          const profileData = await profileRes.json();
          if (profileData.user) {
            setCredits(profileData.user.credits);
          }

          // Fetch user projects list
          const projectsRes = await fetch(`http://localhost:5000/api/projects/user/${user.id}`);
          if (!projectsRes.ok) throw new Error("Projects fetch failed");
          const projectsData = await projectsRes.json();
          if (projectsData.projects) {
            setProjectsList(projectsData.projects);
          }
        } catch (err) {
          console.error("[DashboardOverview] Error:", err);
          setErrorFetch(true);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [isLoaded, user]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Recently";
    }
  };

  // Compute dynamic metrics
  const totalProjects = projectsList.length;

  const projectsWithScore = projectsList.filter(
    (p) => p.overall_score !== null && p.overall_score !== undefined
  );
  
  const averageScore = projectsWithScore.length > 0
    ? Math.round(projectsWithScore.reduce((sum, p) => sum + Number(p.overall_score), 0) / projectsWithScore.length)
    : 100;

  const totalVulnerabilities = projectsList.reduce(
    (sum, p) => sum + Number(p.vulnerability_count || 0), 
    0
  );

  const metrics = [
    {
      title: "Total Projects",
      value: loading ? "..." : totalProjects.toString(),
      description: "Across all active uploads",
      trend: "Lifetime count",
      colorClass: "text-blue-400",
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: "Remaining Credits",
      value: loading ? "..." : credits !== null ? `${credits} / 150` : "150 / 150",
      description: "Safeguard balance limit",
      trend: credits !== null && credits <= 0 ? "Exhausted" : "1 credit per review",
      colorClass: "text-amber-400",
      icon: (
        <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Average Quality Score",
      value: loading ? "..." : `${averageScore}%`,
      description: `Based on ${projectsWithScore.length} review(s)`,
      trend: projectsWithScore.length > 0 ? (averageScore >= 90 ? "Grade A" : averageScore >= 80 ? "Grade B" : "Grade C") : "No scores yet",
      colorClass: "text-purple-400",
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: "Total Vulnerabilities",
      value: loading ? "..." : totalVulnerabilities.toString(),
      description: "Static security checks",
      trend: totalVulnerabilities > 0 ? "Action required" : "All clean",
      colorClass: "text-rose-400",
      icon: (
        <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
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

      {errorFetch && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400 flex gap-2.5 items-start">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Failed to connect to the backend server. Make sure the Node server is running on Port 5000.</span>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div
            key={m.title}
            className="group relative rounded-2xl border border-slate-900 bg-slate-900/10 p-6 hover:bg-slate-900/20 hover:border-slate-800 transition-all duration-300 shadow-md backdrop-blur-md"
          >
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
              <span className={`font-semibold ${m.colorClass}`}>
                {m.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reviews */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-950/20">
          <h3 className="text-md font-bold text-white tracking-wide">Recent Code Reviews</h3>
          <Link href="/dashboard/history" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
            View All History &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading review activity...</span>
            </div>
          ) : projectsList.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 space-y-3">
              <svg className="w-10 h-10 mx-auto text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2M9 5h6" />
              </svg>
              <p className="font-medium text-slate-400">No projects submitted yet.</p>
              <p className="text-[10px] text-slate-600 max-w-xs mx-auto">Create your first code review by clicking the &apos;New Code Review&apos; button above.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 uppercase tracking-wider border-b border-slate-900/80 text-[10px] font-semibold">
                  <th className="py-4 px-6">Project Name</th>
                  <th className="py-4 px-6">Project UUID</th>
                  <th className="py-4 px-6">Code Source</th>
                  <th className="py-4 px-6 text-center">Quality Score</th>
                  <th className="py-4 px-6 text-center">Vulnerabilities</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {projectsList.slice(0, 5).map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-900/20 transition-colors text-slate-300 font-medium"
                  >
                    <td className="py-4.5 px-6 font-semibold text-white">{p.project_name}</td>
                    <td className="py-4.5 px-6 font-mono text-slate-500 text-[10px]">{p.id}</td>
                    <td className="py-4.5 px-6">
                      <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                        Source Code
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-center font-bold">
                       <span className={p.overall_score !== null && p.overall_score !== undefined ? (p.overall_score >= 90 ? 'text-emerald-400' : p.overall_score >= 80 ? 'text-blue-400' : 'text-amber-400') : 'text-slate-500'}>
                         {p.overall_score !== null && p.overall_score !== undefined ? `${p.overall_score}%` : 'Pending'}
                       </span>
                     </td>
                     <td className="py-4.5 px-6 text-center font-bold font-mono">
                       <span className={p.vulnerability_count && p.vulnerability_count > 0 ? 'text-rose-400' : 'text-slate-500'}>
                         {p.vulnerability_count !== null && p.vulnerability_count !== undefined ? p.vulnerability_count : 0}
                       </span>
                     </td>
                     <td className="py-4.5 px-6">
                       {p.overall_score === null || p.overall_score === undefined ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-slate-500/10 text-slate-400 border-slate-500/20">
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                           Staged
                         </span>
                       ) : p.vulnerability_count && p.vulnerability_count > 0 ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/20">
                           <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                           Action Required
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                           Clean
                         </span>
                       )}
                     </td>
                    <td className="py-4.5 px-6 text-right text-slate-500">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}