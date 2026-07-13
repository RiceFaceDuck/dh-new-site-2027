
const TopLoadingBar = () => {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-300">
      <style>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-progress 1.5s infinite ease-in-out;
        }
      `}</style>
      
      {/* 🚀 Top Loading Bar (YouTube Style) */}
      <div className="fixed top-0 left-0 right-0 z-100 h-1 bg-brand-light/20 overflow-hidden">
        <div className="w-full h-full bg-brand animate-loading-bar"></div>
      </div>
      
      {/* Subtle center spinner so the page doesn't look completely blank */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-brand rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-slate-400 animate-pulse tracking-wide font-tech uppercase">Loading...</span>
      </div>
    </div>
  );
};

export default TopLoadingBar;
