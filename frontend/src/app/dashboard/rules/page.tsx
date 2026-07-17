"use client";

import { useState, useEffect } from "react";

interface SastRule {
  id: string;
  name: string;
  regex_pattern: string;
  severity: "Critical" | "High" | "Medium" | "Low" | string;
  description: string;
  suggested_fix: string;
  created_at: string;
}

export default function SastRulesDashboardPage() {
  const [rules, setRules] = useState<SastRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [regexPattern, setRegexPattern] = useState("");
  const [severity, setSeverity] = useState<"Critical" | "High" | "Medium" | "Low">("High");
  const [description, setDescription] = useState("");
  const [suggestedFix, setSuggestedFix] = useState("");
  const [isSubmit, setIsSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("http://localhost:5000/api/rules");
      if (!res.ok) {
        throw new Error("Failed to retrieve custom SAST rules.");
      }
      const data = await res.json();
      setRules(data.rules || []);
    } catch (err: any) {
      console.error("[SastRules] Fetch error:", err);
      setErrorMsg(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !regexPattern.trim()) return;

    try {
      setIsSubmit(true);
      setSubmitError(null);

      const res = await fetch("http://localhost:5000/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ruleName.trim(),
          regexPattern: regexPattern.trim(),
          severity,
          description: description.trim() || null,
          suggestedFix: suggestedFix.trim() || null
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to append custom SAST rule.");
      }

      // Reset form states
      setRuleName("");
      setRegexPattern("");
      setSeverity("High");
      setDescription("");
      setSuggestedFix("");
      setIsModalOpen(false);

      // Refresh list
      fetchRules();
    } catch (err: any) {
      console.error("[SastRules] Submission error:", err);
      setSubmitError(err.message || "Failed to save rule.");
    } finally {
      setIsSubmit(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-900/60">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight">SAST Rules Engine</h2>
          <p className="text-xs text-slate-400">Manage database-driven regular expression signatures scanned by CodePulse AI.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs font-bold text-white rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-2 group select-none"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Custom Rule</span>
        </button>
      </div>

      {/* Main Rules Display Grid */}
      {loading && rules.length === 0 ? (
        <div className="py-24 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading SAST signature database...</span>
        </div>
      ) : errorMsg ? (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400 text-center">
          {errorMsg}
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/5 p-12 text-center text-xs text-slate-500">
          <svg className="w-10 h-10 mx-auto text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold text-slate-400">No SAST rules configured.</p>
          <p className="text-[10px] text-slate-600 mt-1">Add a custom signature pattern above to start scanning your code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-[#090d16]/60 border border-slate-850 p-6 rounded-2xl backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-slate-800 hover:bg-[#090d16]/80 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Header title & severity */}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1">{rule.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                    rule.severity === "Critical"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : rule.severity === "High"
                      ? "bg-rose-400/5 text-rose-300 border-rose-500/10"
                      : rule.severity === "Medium"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {rule.severity}
                  </span>
                </div>

                {/* Regex code pattern */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pattern Regex</span>
                  <pre className="bg-slate-950 border border-slate-900 px-3 py-2 rounded-xl font-mono text-[10px] text-purple-400 overflow-x-auto select-all">
                    {rule.regex_pattern}
                  </pre>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Threat Description</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed min-h-[48px] line-clamp-3">
                    {rule.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Suggested Fix */}
              <div className="space-y-1.5 pt-4 mt-4 border-t border-slate-900/60">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Suggested Fix</span>
                <pre className="bg-slate-950 border border-slate-900 px-3 py-2 rounded-xl font-mono text-[10px] text-emerald-400 overflow-x-auto select-all">
                  {rule.suggested_fix || "No recommendation."}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE RULE MODAL POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#090d16] border border-slate-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            {/* Close trigger button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSubmitError(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer select-none"
              title="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-1.5">
              <h3 className="text-md font-bold text-white">Create Custom SAST Rule</h3>
              <p className="text-xs text-slate-400">Append regular expression rule checks to scan submitted source payloads dynamically.</p>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateRuleSubmit} className="space-y-4">
              {/* Rule Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rule Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Weak Cryptographic Cipher"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Regex string */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regular Expression Pattern</label>
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  placeholder="e.g. crypto\.createHash\(['&quot;]md5['&quot;]\)"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Severity & Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Threat Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief explanation of the threat severity"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Suggested Fix */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Fix / Remediation</label>
                <textarea
                  value={suggestedFix}
                  onChange={(e) => setSuggestedFix(e.target.value)}
                  placeholder="e.g. Use crypto.createHash('sha256') instead of MD5."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Submit trigger button */}
              <button
                type="submit"
                disabled={isSubmit}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs font-bold text-white rounded-xl transition-all shadow-lg cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSubmit ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving custom rule...</span>
                  </>
                ) : (
                  <span>Append Custom Signature</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
