import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';

export default async function LandingPage() {
  const { userId } = await auth();
  const isAuthenticated = !!userId;
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Background blobs for premium glassmorphism glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-900/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white hover:opacity-90 transition-opacity">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>CodePulse <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard" className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg group-hover:scale-105 transition-transform duration-300" />
                <span className="relative block px-4 py-2 text-sm font-semibold bg-slate-950 text-white rounded-[7px] group-hover:bg-slate-950/90 transition-all duration-300">
                  Go to Dashboard
                </span>
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-900/50">
                  Sign In
                </Link>
                <Link href="/sign-up" className="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none">
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg group-hover:scale-105 transition-transform duration-300" />
                  <span className="relative block px-4 py-2 text-sm font-semibold bg-slate-950 text-white rounded-[7px] group-hover:bg-slate-950/90 transition-all duration-300">
                    Get Started
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-36 flex flex-col items-center text-center">
        {/* Glow-in-the-dark Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-semibold text-blue-400 mb-6 shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Production Release: AI SAST Engine Live
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight sm:leading-none text-white">
          Automate Code Reviews.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-500">
            Write Flawless Software.
          </span>
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Upload snippets, receive actionable AI feedback, identify vulnerabilities, and speed up your workflow. A professional, SaaS-ready review companion.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isAuthenticated ? (
            <Link href="/dashboard" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 text-center min-w-[200px]">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/sign-up" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 text-center min-w-[200px]">
              Try CodePulse Free
            </Link>
          )}
          <a href="#demo" className="px-8 py-3.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold rounded-lg backdrop-blur-sm transition-all transform hover:-translate-y-0.5 text-center min-w-[200px]">
            See It In Action
          </a>
        </div>

        {/* Glassmorphic Interactive Dashboard Preview */}
        <div id="demo" className="w-full max-w-5xl mt-20 relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-xl shadow-2xl shadow-slate-950/80">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none rounded-2xl" />
          
          {/* Card Titlebar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-4 px-2">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-xs text-slate-500 font-mono">user_auth_handler.js — AI Review Preview</div>
            <div className="w-6" /> {/* spacer */}
          </div>

          {/* Review Demo Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-left font-mono text-xs overflow-hidden rounded-xl">
            {/* Code Snippet Side */}
            <div className="bg-slate-950/80 border border-slate-800/50 rounded-xl p-4 overflow-x-auto relative">
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-red-950/50 text-red-400 border border-red-500/20">Original</div>
              <pre className="text-slate-300">
                <code>{`// Dangerous password storage setup
const bcrypt = require('bcrypt');

async function registerUser(username, password) {
-  // TODO: Fix connection logic later
-  const query = \`INSERT INTO users(name, pass) 
-                VALUES ('\${username}', '\${password}')\`;
-  await db.query(query);
+  const hashedPassword = await bcrypt.hash(password, 10);
+  const query = 'INSERT INTO users(name, pass) VALUES ($1, $2)';
+  await db.query(query, [username, hashedPassword]);
}`}</code>
              </pre>
            </div>

            {/* AI Assistant Review Side */}
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-between backdrop-blur-lg">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
                    <span className="text-[10px] text-blue-400 font-bold">AI</span>
                  </div>
                  <span className="font-semibold text-slate-200">CodePulse Intelligence</span>
                  <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">Critical Vulnerability</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed mb-4">
                  SQL Injection and Plaintext Password Storage detected!
                </p>
                <ul className="space-y-2 text-slate-400 font-sans list-disc pl-4 leading-relaxed">
                  <li>Direct interpolation of <code className="text-amber-400 font-mono bg-slate-950 px-1 py-0.5 rounded">password</code> allows database structure manipulation.</li>
                  <li>Plaintext passwords should never reach persistence layer. Use <code className="text-blue-400 font-mono bg-slate-950 px-1 py-0.5 rounded">bcrypt</code> or Argon2.</li>
                </ul>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center font-sans">
                <span className="text-[11px] text-slate-500">Confidence Match: 99.8%</span>
                <span className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer flex items-center gap-1">
                  Apply Patch 
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-900/60 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Supercharged Reviewing Workflow
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Eliminate bugs and code-smells before they hit production. Designed to handle source code uploads and security analysis seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/20 p-8 hover:bg-slate-900/40 hover:border-slate-700/60 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Snippet Uploads</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload code blocks directly through our interface. Get immediate AI diagnostics, refactoring tips, and line-by-line notes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/20 p-8 hover:bg-slate-900/40 hover:border-slate-700/60 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Security Audits</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Instantly scan uploaded snippets for hardcoded secrets, SQL injection vulnerabilities, XSS possibilities, and library exploits.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/20 p-8 hover:bg-slate-900/40 hover:border-slate-700/60 transition-all duration-300">
            <div className="w-10 h-10 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">SaaS Ready Foundation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Built on Next.js 15, Clerk Auth, Tailwind v4, and PostgreSQL readiness. Scale easily as your user base expands.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center relative">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/50 to-slate-950 p-12 backdrop-blur-lg relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Ready to upgrade your code quality?
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto leading-relaxed">
            Create an account in seconds and unlock automated code analysis for your projects.
          </p>
          <div className="mt-8">
            <Link href={isAuthenticated ? "/dashboard" : "/sign-up"} className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5">
              {isAuthenticated ? "Go to Dashboard" : "Get Started for Free"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-900/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          &copy; {new Date().getFullYear()} CodePulse AI. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  );
}
