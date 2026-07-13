"use client";

import { useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function NewReviewPage() {
  const { userId } = useAuth();
  const router = useRouter();
  
  // Form State
  const [projectName, setProjectName] = useState("");
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
  const [codeContent, setCodeContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // UI Loading/Status State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);

  // Safeguard limits
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

  // Asynchronous FileReader handler
  const readFileText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = () => reject(new Error("Failed to read file content."));
      reader.readAsText(file);
    });
  };

  const handleFileChange = (file: File | null) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg("File size exceeds the 1MB limit. Please upload a smaller snippet.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setCreatedProjectId(null);

    if (!userId) {
      setErrorMsg("Authentication required. Please sign in again.");
      return;
    }

    if (!projectName.trim()) {
      setErrorMsg("Project Name is required.");
      return;
    }

    let finalCodeContent = "";

    if (activeTab === "paste") {
      if (!codeContent.trim()) {
        setErrorMsg("Please paste some source code to review.");
        return;
      }
      finalCodeContent = codeContent;
    } else {
      if (!selectedFile) {
        setErrorMsg("Please select or drop a source file to upload.");
        return;
      }
      try {
        setLoading(true);
        finalCodeContent = await readFileText(selectedFile);
        if (!finalCodeContent.trim()) {
          setErrorMsg("The selected file is empty. Please upload a valid code file.");
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to read file.");
        setLoading(false);
        return;
      }
    }

    // Submit payload to Express Backend
    try {
      setLoading(true);
      console.log("✈️ FRONTEND SENDING PAYLOAD:", { user_id: userId, project_name: projectName.trim(), code_content: finalCodeContent });
      const res = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          project_name: projectName.trim(),
          code_content: finalCodeContent,
        }),
      });

      console.log("📩 FRONTEND RECEIVED RESPONSE STATUS:", res.status);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setSuccessMsg("Project submitted and staged for AI review successfully!");
      setCreatedProjectId(data.project_id);
      
      // Reset inputs on success
      setProjectName("");
      setCodeContent("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Push state and redirect to dashboard to refresh submissions tracker
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error("❌ FRONTEND NETWORK LAYER FAILURE:", err);
      setErrorMsg(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">New Code Review</h2>
        <p className="text-slate-400 text-sm mt-1">
          Create a project, paste your code block or drop a file, and get instant quality and security feedback.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-900 bg-slate-900/10 p-8 backdrop-blur-md shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Project Name Field */}
        <div className="space-y-2">
          <label htmlFor="projectName" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Project Name
          </label>
          <input
            type="text"
            id="projectName"
            placeholder="e.g. Authentication Handler, Payment API Gateway"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-blue-500/80 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
          />
        </div>

        {/* Tab switcher */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Code Source
          </label>
          
          <div className="flex gap-1 p-1 bg-slate-950/80 border border-slate-900 rounded-xl max-w-sm">
            <button
              type="button"
              onClick={() => { setActiveTab("paste"); setErrorMsg(null); }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "paste"
                  ? "bg-slate-900 text-white border border-slate-800 shadow"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Paste Code Snippet
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("upload"); setErrorMsg(null); }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "upload"
                  ? "bg-slate-900 text-white border border-slate-800 shadow"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Upload Source File
            </button>
          </div>

          {/* Tab 1: Paste Code View */}
          {activeTab === "paste" && (
            <div className="space-y-2">
              <textarea
                placeholder={`// Paste your source code snippet here...\n\nfunction processPayment(amount) {\n  console.log("Processing payment of " + amount);\n}`}
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                disabled={loading}
                rows={12}
                className="w-full px-4 py-4 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-blue-500/80 text-slate-300 placeholder-slate-700 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all resize-y leading-relaxed"
              />
            </div>
          )}

          {/* Tab 2: File Upload View */}
          {activeTab === "upload" && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`w-full py-12 px-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-500/5 text-blue-400"
                  : "border-slate-800/80 bg-slate-950/50 hover:bg-slate-950/80 hover:border-slate-700 text-slate-500"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                disabled={loading}
                accept=".js,.jsx,.ts,.tsx,.py,.go,.cpp,.c,.cs,.html,.css,.json,.md,.txt"
                className="hidden"
              />

              <svg className={`w-10 h-10 mb-4 transition-colors duration-300 ${dragActive ? 'text-blue-400' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>

              {selectedFile ? (
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-slate-300 font-mono">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(2)} KB — Click or drag to replace</p>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-300">Drag & drop your source code file here</p>
                  <p className="text-[10px] text-slate-500">Supports JS, TS, Python, Go, C++, HTML, JSON (Max 1MB)</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400 flex gap-2.5 items-start">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert Message */}
        {successMsg && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400 flex flex-col gap-2">
            <div className="flex gap-2.5 items-start">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{successMsg}</span>
            </div>
            {createdProjectId && (
              <div className="mt-2 pl-6 text-slate-400 font-mono text-[10px]">
                Staged Project UUID: <span className="text-blue-400 font-bold">{createdProjectId}</span>
              </div>
            )}
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-900/60 flex justify-between items-center gap-4">
          <span className="text-[10px] text-slate-500">CodePulse safeguards verify file sizes under 1MB.</span>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Reviewing Code...</span>
              </>
            ) : (
              <>
                <span>Submit for Review</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}