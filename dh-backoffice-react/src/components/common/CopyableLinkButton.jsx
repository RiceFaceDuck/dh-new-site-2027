import { useState, useEffect } from 'react';
import { ExternalLink, Copy } from 'lucide-react';

export default function CopyableLinkButton({ url, label, className, defaultIcon: DefaultIcon }) {
  const [mode, setMode] = useState('copy');
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    let timer;
    if (mode === 'countdown' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (mode === 'countdown' && timeLeft === 0) {
      setMode('copy');
    }
    return () => clearTimeout(timer);
  }, [mode, timeLeft]);

  const handleClick = (e) => {
    if (mode === 'copy') {
      e.preventDefault();
      navigator.clipboard.writeText(url);
      setMode('countdown');
      setTimeLeft(5);
    }
  };

  return (
    <a 
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className={className}
      title={mode === 'copy' ? 'คลิกเพื่อคัดลอกลิงก์' : 'เปิดเว็บ'}
    >
      {mode === 'copy' ? <Copy size={12}/> : (DefaultIcon ? <DefaultIcon size={12}/> : <ExternalLink size={12}/>)} 
      {label} {mode === 'countdown' && `(${timeLeft})`}
    </a>
  );
}
