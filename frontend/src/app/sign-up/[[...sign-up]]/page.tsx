import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="z-10 w-full max-w-md p-4">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            CodePulse <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">Get started today. Create your account in seconds.</p>
        </div>
        <div className="flex justify-center">
          <SignUp 
            appearance={{
              variables: {
                colorPrimary: '#3b82f6',
                colorBackground: '#0f172a',
                colorText: '#f8fafc',
                colorTextSecondary: '#94a3b8',
                colorInputBackground: '#1e293b',
                colorInputText: '#f8fafc',
                colorBorder: '#334155'
              },
              elements: {
                card: 'border border-slate-800 shadow-2xl rounded-2xl bg-slate-900/50 backdrop-blur-xl',
                socialButtonsBlockButton: 'border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 transition-all',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-500/20',
                footerActionLink: 'text-blue-400 hover:text-blue-300 transition-all',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
