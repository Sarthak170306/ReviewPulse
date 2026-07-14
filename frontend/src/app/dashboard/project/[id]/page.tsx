"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Finding {
  id: string;
  severity: "High" | "Medium" | "Low" | string;
  issue: string;
  explanation: string;
  suggested_fix: string;
  file_name: string;
  line_number: number;
}

interface ProjectMetadata {
  id: string;
  project_name: string;
  code_content: string;
  overall_score: number;
}

interface ReportResponse {
  success: boolean;
  project: ProjectMetadata;
  findings: Finding[];
}

export default function ProjectReportPage() {
  const router = useRouter();
  const { id } = useParams();

  const [projectData, setProjectData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorFetch, setErrorFetch] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setErrorFetch(null);
        
        const res = await fetch(`http://localhost:5000/api/projects/${id}/report`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Report not found in Supabase database.");
          }
          throw new Error("Failed to load review report data.");
        }
        
        const resData = await res.json();
        console.log("🔥 FULL BACKEND DATA OBJECT RECEIVED:", resData);
        setProjectData(resData);

        // Pre-select first finding if available
        if (resData.findings && resData.findings.length > 0) {
          setSelectedFinding(resData.findings[0]);
        }
      } catch (err: any) {
        console.error("[ProjectReport] Fetch failed:", err);
        setErrorFetch(err.message || "An unexpected network error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Aggregating review report payload...</span>
      </div>
    );
  }

  if (errorFetch || !projectData || !projectData.project) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400">
          {errorFetch || "Report not found."}
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs text-white rounded-lg hover:bg-slate-800/80 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { project, findings } = projectData;
  const rawCode = project?.code_content || "";

  // Group findings by line number for lookup
  const findingsByLine = findings.reduce<Record<number, Finding[]>>((acc, f) => {
    if (!acc[f.line_number]) acc[f.line_number] = [];
    acc[f.line_number].push(f);
    return acc;
  }, {});

  const getLineHighlightClass = (lineNum: number) => {
    const lineFindings = findingsByLine[lineNum];
    if (!lineFindings) return "hover:bg-slate-900/20 border-l-2 border-transparent";
    
    // Determine priority (High > Medium/Low)
    const severities = lineFindings.map(f => f.severity);
    if (severities.includes("High")) {
      return "bg-rose-500/10 border-l-2 border-rose-500 hover:bg-rose-500/15 cursor-pointer animate-pulse-subtle";
    }
    return "bg-amber-500/10 border-l-2 border-amber-500 hover:bg-amber-500/15 cursor-pointer";
  };

  const score = project.overall_score ?? 100;
  const scoreColorClass = score >= 90 
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
    : score >= 80 
    ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
    : "bg-amber-500/10 text-amber-400 border-amber-500/20";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button and title header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-900/60">
        <div className="space-y-1.5">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 font-medium transition-colors mb-2"
          >
            &larr; Back to Dashboard
          </button>
          <h2 className="text-xl font-bold text-white tracking-tight">{project.project_name}</h2>
          <p className="text-xs text-slate-400 font-mono">UUID: {id}</p>
        </div>

        {/* Dynamic telemetry stats */}
        <div className="flex gap-4">
          <div className={`px-4 py-2 rounded-xl border flex flex-col items-center justify-center ${scoreColorClass}`}>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Quality Score</span>
            <span className="text-xl font-extrabold">{score}%</span>
          </div>
          <div className="px-4 py-2 rounded-xl border border-slate-900 bg-slate-950/40 flex flex-col items-center justify-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Total Issues</span>
            <span className="text-xl font-extrabold text-white">{findings.length}</span>
          </div>
        </div>
      </div>

      {/* Main split-pane container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Interactive Code Viewer */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/60 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-mono">code_snippet.txt</span>
            <span className="text-[10px] text-slate-500">Click highlighted lines to inspect issues</span>
          </div>
          
          <div className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-slate-300 select-text">
            {!rawCode ? (
              <div className="text-slate-500 p-4">
                No string matching &apos;code_content&apos; found inside response keys.
              </div>
            ) : (
              <div className="min-w-max">
                {rawCode.split('\n').map((line: string, index: number) => {
                  const lineNum = index + 1;
                  const highlightClass = getLineHighlightClass(lineNum);
                  const lineFindings = findingsByLine[lineNum];
                  
                  return (
                    <div
                      key={lineNum}
                      onClick={() => {
                        if (lineFindings && lineFindings.length > 0) {
                          setSelectedFinding(lineFindings[0]);
                        }
                      }}
                      className={`flex items-stretch py-0.5 transition-all ${highlightClass}`}
                    >
                      {/* Line number rail */}
                      <span className="w-12 text-right pr-4 text-[10px] text-slate-600 select-none border-r border-slate-900/60 shrink-0 mr-4 font-mono font-semibold">
                        {lineNum}
                      </span>
                      {/* Line content */}
                      <pre className="whitespace-pre-wrap font-mono pr-4 leading-normal flex-1">
                        {line || " "}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Finding Details Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Findings List ({findings.length})
          </h3>

          <div className="flex flex-col gap-4">
            {findings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/5 p-6 text-center text-xs text-slate-500">
                <svg className="w-8 h-8 mx-auto text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold text-slate-400">No active code violations detected.</p>
                <p className="text-[10px] text-slate-600 mt-1">Your code snippet is clean!</p>
              </div>
            ) : (
              findings.map((finding) => {
                const isSelected = selectedFinding?.line_number === finding.line_number;
                const borderHighlightClass = isSelected
                  ? "ring-2 ring-blue-500/50 bg-slate-900/90 border-slate-700"
                  : "border-slate-900 hover:border-slate-800 hover:bg-slate-900/20";
                
                return (
                  <div
                    key={finding.id}
                    onClick={() => setSelectedFinding(finding)}
                    className={`group relative rounded-2xl border p-5 backdrop-blur-md shadow-lg transition-all duration-300 cursor-pointer ${borderHighlightClass}`}
                  >
                    {/* Severity & Line Badge */}
                    <div className="flex justify-between items-center mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        finding.severity === "High"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : finding.severity === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          finding.severity === "High" ? "bg-rose-400" : finding.severity === "Medium" ? "bg-amber-400" : "bg-blue-400"
                        }`} />
                        {finding.severity}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        Line {finding.line_number}
                      </span>
                    </div>

                    {/* Issue Header */}
                    <div className="space-y-1.5 mb-3">
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        {finding.issue}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {finding.explanation}
                      </p>
                    </div>

                    {/* Suggested Fix */}
                    <div className="space-y-1.5 pt-2.5 border-t border-slate-900/60">
                      <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Suggested Fix</h5>
                      <div className="rounded-xl border border-slate-900 bg-slate-950 p-3 font-mono text-[9px] text-emerald-400/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {finding.suggested_fix}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
