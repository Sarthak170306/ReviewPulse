"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

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
  webhook_url?: string;
  overall_score: number;
}

interface Collaborator {
  id: string;
  project_id: string;
  user_email: string;
  role: "Viewer" | "Editor" | string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  project_id: string;
  user_name: string;
  action: string;
  created_at: string;
}

interface ReportResponse {
  success: boolean;
  project: ProjectMetadata;
  findings: Finding[];
  collaborators: Collaborator[];
  activityLogs: ActivityLog[];
  code_content?: string;
}

interface FixSuggestionResponse {
  success: boolean;
  originalLine: string;
  refactoredLine: string;
  explanation: string;
}

export default function ProjectReportPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useUser();

  const [projectData, setProjectData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorFetch, setErrorFetch] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"Viewer" | "Editor">("Viewer");
  const [isSharingSubmit, setIsSharingSubmit] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Webhook modal state
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isWebhookSubmit, setIsWebhookSubmit] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [webhookSuccess, setWebhookSuccess] = useState(false);

  // AI Auto-Fix suggestions states
  const [activeFixData, setActiveFixData] = useState<FixSuggestionResponse | null>(null);
  const [loadingFix, setLoadingFix] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Webhook Integrations states
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<Record<string, string>>({});

  const fetchWebhooks = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}/webhooks`);
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (err) {
      console.error("Failed to load webhook list:", err);
    }
  };

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
      if (resData.project && !resData.code_content) {
        resData.code_content = resData.project.code_content;
      }
      setProjectData(resData);
      
      if (resData.project && resData.project.webhook_url) {
        setWebhookUrl(resData.project.webhook_url);
      }

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

  useEffect(() => {
    if (id) {
      fetchReport();
      fetchWebhooks();
    }
  }, [id]);

  useEffect(() => {
    if (selectedFinding && id) {
      const fetchFixSuggestion = async () => {
        try {
          setLoadingFix(true);
          setActiveFixData(null);
          setApplySuccess(false);

          const res = await fetch(`http://localhost:5000/api/projects/${id}/fix-finding`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              findingId: selectedFinding.id,
              lineNumber: selectedFinding.line_number
            })
          });

          if (!res.ok) {
            throw new Error("Failed to configure fix metadata.");
          }

          const fixJson = await res.json();
          setActiveFixData(fixJson);
        } catch (err) {
          console.error("[ProjectReport] Fetching AI fix failed:", err);
        } finally {
          setLoadingFix(false);
        }
      };

      fetchFixSuggestion();
    } else {
      setActiveFixData(null);
    }
  }, [selectedFinding, id]);

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    try {
      setIsSharingSubmit(true);
      setShareError(null);

      const activeUser = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous";
      
      const res = await fetch(`http://localhost:5000/api/projects/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: shareEmail.trim(),
          role: shareRole,
          userName: activeUser
        })
      });

      if (!res.ok) {
        throw new Error("Failed to share project audit.");
      }

      setShareEmail("");
      setIsShareModalOpen(false);
      fetchReport();
    } catch (err: any) {
      console.error("[ProjectReport] Share error:", err);
      setShareError(err.message || "Failed to share project.");
    } finally {
      setIsSharingSubmit(false);
    }
  };

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsWebhookSubmit(true);
      setWebhookError(null);
      setWebhookSuccess(false);

      const res = await fetch(`http://localhost:5000/api/projects/${id}/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim() || null
        })
      });

      if (!res.ok) {
        throw new Error("Failed to configure webhook endpoint.");
      }

      setWebhookSuccess(true);
      setTimeout(() => {
        setIsWebhookModalOpen(false);
        setWebhookSuccess(false);
      }, 1500);

      fetchReport();
    } catch (err: any) {
      console.error("[ProjectReport] Webhook setup error:", err);
      setWebhookError(err.message || "Failed to save webhook configuration.");
    } finally {
      setIsWebhookSubmit(false);
    }
  };

  const handleApplyAiFix = async (targetLineNumber: number, targetRefactoredLine: string) => {
    try {
      if (!projectData || !projectData.code_content) return;
      
      // Convert multi-line raw string content into an easily indexable array
      const updatedLinesArray = projectData.code_content.split('\n');
      
      // Enforce absolute, unconditional array value hot-swap at the exact index
      updatedLinesArray[targetLineNumber - 1] = targetRefactoredLine;
      
      // Join back cleanly into a single unified continuous payload string block
      const updatedCodeTextPayload = updatedLinesArray.join('\n');
      
      // Force push this new state straight into the component's root data
      setProjectData((prev: any) => {
        if (!prev) return null;
        const nextData = {
          ...prev,
          code_content: updatedCodeTextPayload
        };
        if (nextData.project) {
          nextData.project = {
            ...nextData.project,
            code_content: updatedCodeTextPayload
          };
        }
        return nextData;
      });
      
      // Force-increment editorKey state parameter counter to force re-render
      setEditorKey(prev => prev + 1);
      
      // Fire network update background sync
      const activeUser = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous";
      const syncResponse = await fetch(`http://localhost:5000/api/projects/${id}/update-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeContent: updatedCodeTextPayload,
          logMessage: `AI Auto-Fix patch applied securely to Line ${targetLineNumber}`,
          userName: activeUser
        })
      });
      
      if (syncResponse.ok) {
        setApplySuccess(true);
        // Refresh the full layout metrics to populate tracking timelines
        fetchReport();
      }
    } catch (error) {
      console.error("Critical Client State Alignment Failure:", error);
    }
  };

  // Reconstruct standard unified Git Remediation Diff Patch structure
  const generateGitPatch = (code: string, activeFindings: Finding[]) => {
    if (!code) return "";

    const lines = code.split("\n");
    const linesCount = lines.length;

    const patchFindings = activeFindings.reduce<Record<number, Finding>>((acc, f) => {
      acc[f.line_number] = f;
      return acc;
    }, {});

    let patchContent = `--- a/code_snippet.txt\n+++ b/code_snippet.txt\n@@ -1,${linesCount} +1,${linesCount} @@\n`;

    for (let idx = 0; idx < linesCount; idx++) {
      const lineNum = idx + 1;
      const originalLine = lines[idx];
      const finding = patchFindings[lineNum];

      if (finding && finding.suggested_fix) {
        patchContent += `-${originalLine}\n`;
        const fixLines = finding.suggested_fix.split("\n");
        fixLines.forEach((fixLine) => {
          patchContent += `+${fixLine}\n`;
        });
      } else {
        patchContent += ` ${originalLine}\n`;
      }
    }

    return patchContent;
  };

  const handleDownloadPatch = () => {
    if (!projectData) return;
    const currentCode = projectData.project?.code_content || projectData.code_content || "";
    const patchString = generateGitPatch(currentCode, projectData.findings);
    if (!patchString) return;

    const blob = new Blob([patchString], { type: "text/x-diff" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codepulse_remediation.patch`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;

    try {
      setIsAddingWebhook(true);
      const res = await fetch(`http://localhost:5000/api/projects/${id}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url_endpoint: newWebhookUrl.trim(),
          event_types: "finding.detected,fix.applied"
        })
      });

      if (res.ok) {
        setNewWebhookUrl("");
        fetchWebhooks();
      }
    } catch (err) {
      console.error("Failed to add webhook endpoint:", err);
    } finally {
      setIsAddingWebhook(false);
    }
  };

  const handleTestWebhook = async (webhookId: string, urlEndpoint: string) => {
    try {
      setTestingWebhookId(webhookId);
      setTestFeedback(prev => ({ ...prev, [webhookId]: "Sending mock security alert..." }));
      
      const res = await fetch(`http://localhost:5000/api/projects/${id}/webhooks/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url_endpoint: urlEndpoint })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestFeedback(prev => ({ ...prev, [webhookId]: "🟢 Mock security ping delivered!" }));
      } else {
        setTestFeedback(prev => ({ ...prev, [webhookId]: `🔴 Webhook delivery failed: ${data.message || "Invalid token or unreachable endpoint status."}` }));
      }
      
      fetchWebhooks();
    } catch (err) {
      console.error("Webhook test failed:", err);
      setTestFeedback(prev => ({ ...prev, [webhookId]: "🔴 Webhook delivery failed: Connection Error" }));
      fetchWebhooks();
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleExportPDF = async () => {
    window.print();

    // Log PDF export activity in background
    try {
      const activeUser = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Anonymous";
      await fetch(`http://localhost:5000/api/projects/${id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: activeUser,
          action: "Report exported as PDF"
        })
      });

      fetchReport();
    } catch (err) {
      console.error("[ProjectReport] Background log activity failed:", err);
    }
  };

  if (loading && !projectData) {
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

  const { project, findings, collaborators, activityLogs } = projectData;
  const rawCode = projectData?.code_content || project?.code_content || "";

  // Dynamic severity count calculations
  const highCount = findings.filter(f => f.severity === "High").length;
  const mediumCount = findings.filter(f => f.severity === "Medium").length;
  const lowCount = findings.filter(f => f.severity === "Low").length;
  const critCount = findings.filter(f => f.severity === "Critical").length;
  
  const totalFindings = findings.length || 1;
  const pctHigh = (highCount / totalFindings) * 100;
  const pctMedium = (mediumCount / totalFindings) * 100;
  const pctLow = (lowCount / totalFindings) * 100;

  // Compliance Readiness Executive Values
  const totalCriticalHigh = highCount + critCount;
  const owaspGrade = totalCriticalHigh === 0 ? "A" : totalCriticalHigh <= 2 ? "B" : totalCriticalHigh <= 4 ? "C" : "F";

  const uniqueInfectedLines = new Set(findings.map(f => f.line_number)).size;
  const totalLinesOfCode = rawCode.split('\n').length || 1;

  const appliedFixesCount = activityLogs.filter(log => log.action.includes('AI Auto-Fix patch applied securely')).length;
  const totalResolvedAndUnresolved = findings.length + appliedFixesCount;
  const autonomyPct = totalResolvedAndUnresolved > 0 ? Math.round((appliedFixesCount / totalResolvedAndUnresolved) * 100) : 100;

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
    <>
      {/* 1. SCREEN VIEW CONTAINER (Hidden during printing) */}
      <div className="space-y-6 max-w-7xl mx-auto print:hidden">
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

          {/* Dynamic telemetry stats & Export/Share/Webhook CTAs */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Webhook Settings CTA */}
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white hover:bg-slate-800/80 transition-all backdrop-blur-md shadow-lg flex items-center gap-2 group cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Integrate Webhook</span>
            </button>

            {/* Share Audit CTA */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white hover:bg-slate-800/80 transition-all backdrop-blur-md shadow-lg flex items-center gap-2 group cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.828-2.414m0 0a3 3 0 10-3.62-1.09l-4.829 2.414m4.829 2.414a3 3 0 11-3.62 1.09l-4.828-2.414m4.828 2.414a3 3 0 103.62-1.09" />
              </svg>
              <span>Share Audit</span>
            </button>

            {/* Export Audit Report CTA */}
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white hover:bg-slate-800/80 transition-all backdrop-blur-md shadow-lg flex items-center gap-2 group cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export Audit Report</span>
            </button>

            <div className={`px-4 py-2 rounded-xl border flex flex-col items-center justify-center ${scoreColorClass}`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Quality Score</span>
              <span className="text-xl font-extrabold">{score}%</span>
            </div>

            <div className="px-4 py-2 rounded-xl border border-slate-900 bg-slate-950/40 flex flex-col justify-center text-slate-400 min-w-[130px]">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Total Issues</span>
                <span className="text-lg font-extrabold text-white">{findings.length}</span>
              </div>
              
              {/* Proportional Severity Density Micro-chart */}
              {findings.length > 0 && (
                <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-800 mt-2">
                  {highCount > 0 && <div className="bg-rose-500 h-full transition-all" style={{ width: `${pctHigh}%` }} title={`High: ${highCount}`} />}
                  {mediumCount > 0 && <div className="bg-amber-500 h-full transition-all" style={{ width: `${pctMedium}%` }} title={`Medium: ${mediumCount}`} />}
                  {lowCount > 0 && <div className="bg-blue-400 h-full transition-all" style={{ width: `${pctLow}%` }} title={`Low: ${lowCount}`} />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compliance Readiness Executive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
          {/* Card A: OWASP Grade */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-md shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OWASP Top 10 Readiness</h4>
              <p className="text-2xl font-extrabold text-white">Grade {owaspGrade}</p>
              <p className="text-[10px] text-slate-400">
                {totalCriticalHigh} Critical/High risks active
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
              owaspGrade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              owaspGrade === 'B' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              owaspGrade === 'C' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {owaspGrade}
            </div>
          </div>

          {/* Card B: Exposure Surface */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-md shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Exposure Surface</h4>
              <p className="text-2xl font-extrabold text-white">
                {((uniqueInfectedLines / totalLinesOfCode) * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-400">
                {uniqueInfectedLines} / {totalLinesOfCode} lines of code affected
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-mono text-xs">
              {uniqueInfectedLines}L
            </div>
          </div>

          {/* Card C: System Autonomy Status */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-md shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Autonomy Status</h4>
              <p className="text-2xl font-extrabold text-white">{autonomyPct}%</p>
              <p className="text-[10px] text-slate-400">
                {appliedFixesCount} of {totalResolvedAndUnresolved} issues patched by AI
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <svg className="w-5 h-5 text-blue-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Real-time Alert Integrations Panel */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-md shadow-xl space-y-6 print:hidden">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">🔌 Real-time Alert Integrations</h3>
          </div>

          <form onSubmit={handleAddWebhook} className="flex gap-3 max-w-2xl">
            <input
              type="url"
              required
              placeholder="Append slack/discord or custom payload webhook endpoint (e.g. https://hooks.slack.com/services/...)"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
            />
            <button
              type="submit"
              disabled={isAddingWebhook}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer shrink-0 select-none"
            >
              {isAddingWebhook ? "Adding..." : "Add Endpoint"}
            </button>
          </form>

          {/* Webhook Subscription Table list */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered Alert Destinations</h4>
            {webhooks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No webhooks configured for this project yet.</p>
            ) : (
              <div className="divide-y divide-slate-900 border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20 font-mono text-xs">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/10 transition-all">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-slate-300 truncate font-semibold">{wh.url_endpoint}</p>
                      <div className="flex gap-2 text-[10px] text-slate-500">
                        <span>Events: <strong className="text-slate-400">{wh.event_types}</strong></span>
                        <span>&bull;</span>
                        <span>Created: {new Date(wh.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Active Status Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        wh.status === 'Active' 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${wh.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {wh.status === 'Active' ? 'Active' : 'Failing'}
                      </span>

                      {/* Test Ping Action button */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestWebhook(wh.id, wh.url_endpoint)}
                          disabled={testingWebhookId === wh.id}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-sans font-bold cursor-pointer select-none"
                        >
                          {testingWebhookId === wh.id ? "Pinging..." : "⚡ Test Ping"}
                        </button>
                        {testFeedback[wh.id] && (
                          <span className="text-[10px] text-slate-400 transition-all animate-fade-in font-sans">{testFeedback[wh.id]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main split-pane container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Interactive Code Viewer */}
          <div key={editorKey} className="lg:col-span-8 rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden shadow-xl">
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
            <div className="flex flex-col gap-3 p-4 border-b border-slate-800">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-lg font-bold tracking-wide text-slate-200">FINDINGS LIST ({findings.length})</h3>
              </div>
              {findings.length > 0 && (
                <div className="flex items-center gap-2 w-full justify-start overflow-visible">
                  <button
                    onClick={handleDownloadPatch}
                    className="text-[10px] px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all font-sans font-bold flex items-center gap-1.5 cursor-pointer select-none shrink-0"
                    title="Generate and download unified Git patch file"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Git Patch</span>
                  </button>

                  <div className="relative inline-block text-left shrink-0">
                    <button
                      onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                      className="text-[10px] px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white transition-all font-sans font-bold flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <span>⚡ Export Audits</span>
                      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExportDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-56 rounded-md bg-slate-900 border border-slate-800 shadow-xl z-50 overflow-hidden py-1 divide-y divide-slate-850 animate-fade-in font-sans">
                        <button
                          onClick={() => {
                            setIsExportDropdownOpen(false);
                            window.open(`http://localhost:5000/api/projects/${id}/export/pdf`, '_blank');
                          }}
                          className="w-full text-left px-4 py-2.5 text-[10px] font-medium text-slate-300 hover:bg-blue-600/10 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>Executive PDF Summary</span>
                        </button>
                        <button
                          onClick={async () => {
                            setIsExportDropdownOpen(false);
                            try {
                              const res = await fetch(`http://localhost:5000/api/projects/${id}/export/json`);
                              if (!res.ok) throw new Error("Failed to load JSON export.");
                              const data = await res.json();
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `codepulse_dump_${id}.json`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="w-full text-left px-4 py-2.5 text-[10px] font-medium text-slate-300 hover:bg-blue-600/10 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Metadata Dump (JSON)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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

                      {/* AI Auto-Fix suggestion container */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-slate-900/60 space-y-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">AI Auto-Fix Suggestion</h5>
                          </div>

                          {loadingFix ? (
                            <div className="flex items-center gap-2 py-4 text-[10px] text-slate-500">
                              <svg className="animate-spin h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Analyzing refactoring context...</span>
                            </div>
                          ) : activeFixData ? (
                            <div className="space-y-3">
                              {/* Stacked Git-Style Diff Layout */}
                              <div className="rounded-xl border border-slate-900 overflow-hidden font-mono text-[9px] divide-y divide-slate-900">
                                {/* Red block: Original */}
                                <div className="bg-rose-950/20 text-rose-300 p-2.5 flex items-start gap-2">
                                  <span className="text-rose-500 font-bold select-none shrink-0">-</span>
                                  <span className="break-all">{activeFixData.originalLine || " "}</span>
                                </div>
                                {/* Green block: Refactored */}
                                <div className="bg-emerald-950/20 text-emerald-300 p-2.5 flex items-start gap-2">
                                  <span className="text-emerald-500 font-bold select-none shrink-0">+</span>
                                  <span className="break-all">{activeFixData.refactoredLine || " "}</span>
                                </div>
                              </div>

                              {/* Explanation */}
                              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 text-[10px] text-slate-400 leading-relaxed">
                                {activeFixData.explanation}
                              </div>

                              {/* Apply Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyAiFix(finding.line_number, activeFixData.refactoredLine);
                                }}
                                disabled={applySuccess}
                                className={`w-full py-2 rounded-xl text-[10px] font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                                  applySuccess
                                    ? "bg-emerald-600 border border-emerald-500"
                                    : "bg-blue-600 hover:bg-blue-700 border border-blue-500"
                                }`}
                              >
                                {applySuccess ? (
                                  <span>&check; AI Fix Applied</span>
                                ) : (
                                  <span>✨ Apply AI Fix</span>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 italic">No suggestion calculated.</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Activity log timeline */}
        <div className="border-t border-slate-900/60 pt-8 mt-8">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">Audit Activity Trail</h3>
          </div>

          <div className="relative pl-6 border-l border-slate-800/80 space-y-6">
            {activityLogs && activityLogs.length > 0 ? (
              activityLogs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline bullet dot */}
                  <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-[#030712] transition-colors group-hover:bg-purple-500" />
                  
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300 font-medium">
                      {log.action}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-400">{log.user_name}</span>
                      <span>&bull;</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No activity logs recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Share project modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative space-y-4 animate-fade-in">
            <button
              onClick={() => {
                setIsShareModalOpen(false);
                setShareError(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer select-none"
              title="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-1.5">
              <h3 className="text-md font-bold text-white">Share Audit Project</h3>
              <p className="text-xs text-slate-400">Invite collaborators to view or inspect code review violations.</p>
            </div>

            {shareError && (
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400">
                {shareError}
              </div>
            )}

            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collaborator Email</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="collaborator@company.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Permission</label>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Viewer">Viewer (Read Only)</option>
                  <option value="Editor">Editor (Full Access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSharingSubmit}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs font-bold text-white rounded-xl transition-all shadow-lg cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSharingSubmit ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Inviting...</span>
                  </>
                ) : (
                  <span>Send Invitation</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Webhook modal */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative space-y-4 animate-fade-in">
            <button
              onClick={() => {
                setIsWebhookModalOpen(false);
                setWebhookError(null);
                setWebhookSuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer select-none"
              title="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-1.5">
              <h3 className="text-md font-bold text-white">Integrate Slack/Discord Webhook</h3>
              <p className="text-xs text-slate-400">Receive instant markdown notifications on scan completions and collaborators updates.</p>
            </div>

            {webhookError && (
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400">
                {webhookError}
              </div>
            )}

            {webhookSuccess && (
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400">
                Webhook endpoint configured successfully!
              </div>
            )}

            <form onSubmit={handleWebhookSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Webhook Endpoint URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isWebhookSubmit}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs font-bold text-white rounded-xl transition-all shadow-lg cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isWebhookSubmit ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. PRINT-OPTIMIZED DOCUMENT TEMPLATE (Visible ONLY during print layout compilation) */}
      <div className="hidden print:block bg-white text-black p-8 font-sans space-y-8 select-text w-full max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight uppercase text-slate-900">CodePulse AI Security Audit</h1>
            <p className="text-sm font-semibold text-slate-600">Project Name: {project.project_name}</p>
            <p className="text-[11px] text-slate-500 font-mono">Project UUID: {id}</p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-1">
            <p className="font-semibold">Generated: {new Date().toLocaleDateString()}</p>
            <p>{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Executive Scorecard */}
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-center items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Quality Score</span>
            <span className="text-3xl font-extrabold text-slate-900">{score}%</span>
          </div>
          <div className="border border-slate-200 rounded-xl p-4 bg-rose-50/30 flex flex-col justify-center items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700">High Severity</span>
            <span className="text-2xl font-extrabold text-rose-600">{highCount}</span>
          </div>
          <div className="border border-slate-200 rounded-xl p-4 bg-amber-50/30 flex flex-col justify-center items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700">Medium Severity</span>
            <span className="text-2xl font-extrabold text-amber-600">{mediumCount}</span>
          </div>
          <div className="border border-slate-200 rounded-xl p-4 bg-blue-50/30 flex flex-col justify-center items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">Low Severity</span>
            <span className="text-2xl font-extrabold text-blue-600">{lowCount}</span>
          </div>
        </div>

        {/* Tabular Analysis Summary Matrix */}
        <div className="space-y-4">
          <h2 className="text-md font-bold text-slate-900 border-b border-slate-200 pb-2">Tabular Violation Registry</h2>
          
          {findings.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No active code violations detected. This project holds no vulnerabilities.</p>
          ) : (
            <table className="w-full border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100/80">
                  <th className="border border-slate-200 p-2.5 text-center w-16 font-bold text-slate-800">Line</th>
                  <th className="border border-slate-200 p-2.5 text-center w-24 font-bold text-slate-800">Severity</th>
                  <th className="border border-slate-200 p-2.5 text-left w-56 font-bold text-slate-800">Issue Description</th>
                  <th className="border border-slate-200 p-2.5 text-left font-bold text-slate-800">Explanation & Recommended Fix</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f) => (
                  <tr key={f.id} className="align-top hover:bg-slate-50/40">
                    <td className="border border-slate-200 p-2.5 text-center font-mono font-semibold text-slate-600">
                      {f.line_number}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${
                        f.severity === "High"
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : f.severity === "Medium"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}>
                        {f.severity}
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2.5 font-bold text-slate-900">
                      {f.issue}
                    </td>
                    <td className="border border-slate-200 p-2.5 space-y-2 leading-relaxed text-slate-700">
                      <p>{f.explanation}</p>
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Suggested Code Fix</p>
                        <pre className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[9px] text-slate-800 whitespace-pre-wrap">
                          {f.suggested_fix}
                        </pre>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info page numbers */}
        <div className="border-t border-slate-200 pt-6 text-[10px] text-slate-400 flex justify-between items-center">
          <p>CodePulse AI Audit Service &bull; All Rights Reserved &copy; {new Date().getFullYear()}</p>
          <p>Page 1 of 1</p>
        </div>
      </div>
    </>
  );
}
