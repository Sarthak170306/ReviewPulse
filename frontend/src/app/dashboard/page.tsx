import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="z-10 text-center max-w-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Dashboard Placeholder
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          You have successfully logged in and routed to the protected dashboard zone.
        </p>
        <Link 
          href="/" 
          className="inline-block px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
        >
          Back to Landing Page
        </Link>
      </div>
    </div>
  );
}
