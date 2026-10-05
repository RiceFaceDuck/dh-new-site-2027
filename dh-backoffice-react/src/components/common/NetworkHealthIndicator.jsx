import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { resilientFetch } from 'dh-shared/src/utils/httpResilienceClient';

export default function NetworkHealthIndicator({ compact = false }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [latency, setLatency] = useState(25); // Simulated ping latency in ms

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Micro-ping latency check with 3000ms AbortController timeout
    const interval = setInterval(() => {
      if (navigator.onLine) {
        const start = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        resilientFetch('/favicon.ico?t=' + Date.now(), { method: 'HEAD', cache: 'no-store', signal: controller.signal }, 1)
          .then((res) => {
            clearTimeout(timeoutId);
            if (res.ok) {
              const end = performance.now();
              setLatency(Math.max(1, Math.round(end - start)));
            } else {
              setLatency(120);
            }
          })
          .catch(() => {
            clearTimeout(timeoutId);
            setLatency(120);
          });
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return { bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20', dot: 'bg-rose-500 animate-ping', text: 'Offline' };
    if (latency < 80) return { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500', text: `Online (${latency}ms)` };
    return { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500', text: `Slow (${latency}ms)` };
  };

  const status = getStatusColor();

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full border transition-all duration-300 whitespace-nowrap ${status.bg}`}>
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${status.dot}`}></span>
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.dot.split(' ')[0]}`}></span>
        </span>
        {isOnline ? (
          <span className="font-mono tracking-tight">{status.text}</span>
        ) : (
          <span className="font-semibold text-rose-500">Offline</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-full border backdrop-blur-md transition-all duration-300 ${status.bg}`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${status.dot}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dot.split(' ')[0]}`}></span>
      </span>
      {isOnline ? (
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 opacity-80" />
          <span className="hidden sm:inline font-mono">{status.text}</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5" />
          <span className="font-semibold">สัญญาณขาดหาย</span>
        </span>
      )}
    </div>
  );
}
