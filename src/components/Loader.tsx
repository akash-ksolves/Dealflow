import { Loader2 } from 'lucide-react';

export default function Loader({ message = 'Syncing Data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center shadow-inner">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
        <div className="absolute -inset-4 bg-brand-500/5 rounded-full blur-2xl animate-pulse"></div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
          {message}
        </p>
        <div className="mt-4 flex gap-1 justify-center">
          <div className="w-1 h-1 rounded-full bg-brand-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 rounded-full bg-brand-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 rounded-full bg-brand-600 animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
