import React, { useState, useRef, useMemo } from 'react';
import { 
  Bold, 
  Italic, 
  Heading, 
  List, 
  ListOrdered, 
  Quote, 
  Minus, 
  Eye, 
  Edit3, 
  Maximize2, 
  Minimize2,
  CornerDownLeft,
  X
} from 'lucide-react';

/**
 * Inline formatting renderer for Live Preview
 */
function renderPreviewInline(text) {
  if (!text) return null;
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|<br\s*\/?>)/g);

  return tokens.map((token, index) => {
    if (!token) return null;
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return <strong key={index} className="font-bold text-slate-900 dark:text-white">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      return <em key={index} className="italic text-slate-800 dark:text-slate-200">{token.slice(1, -1)}</em>;
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-mono text-xs">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (/^<br\s*\/?>$/i.test(token)) {
      return <br key={index} />;
    }
    return token;
  });
}

/**
 * Full Description Live Preview matching Storefront rendering
 */
function DescriptionPreview({ text }) {
  const blocks = useMemo(() => {
    if (!text || typeof text !== 'string') return null;

    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rawChunks = normalized.split(/\n{2,}/);

    return rawChunks.map((chunk, chunkIdx) => {
      const trimmed = chunk.trim();
      if (!trimmed) return null;

      if (/^[-*_]{3,}$/.test(trimmed)) {
        return <hr key={chunkIdx} className="my-4 border-slate-200 dark:border-slate-700" />;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        if (level === 1) {
          return (
            <h2 key={chunkIdx} className="text-base md:text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">
              {renderPreviewInline(headingText)}
            </h2>
          );
        }
        if (level === 2) {
          return (
            <h3 key={chunkIdx} className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1.5">
              {renderPreviewInline(headingText)}
            </h3>
          );
        }
        return (
          <h4 key={chunkIdx} className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1">
            {renderPreviewInline(headingText)}
          </h4>
        );
      }

      if (trimmed.startsWith('>')) {
        const quoteLines = trimmed.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n');
        return (
          <blockquote key={chunkIdx} className="border-l-4 border-cyan-500 pl-3.5 py-1.5 my-2.5 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 italic rounded-r text-xs md:text-sm">
            {quoteLines.split('\n').map((line, lIdx, arr) => (
              <React.Fragment key={lIdx}>
                {renderPreviewInline(line)}
                {lIdx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </blockquote>
        );
      }

      const lines = trimmed.split('\n');

      const isBulletList = lines.every(l => /^[-*•]\s+/.test(l.trim()));
      if (isBulletList) {
        return (
          <ul key={chunkIdx} className="my-2.5 space-y-1 pl-5 list-disc text-slate-700 dark:text-slate-300 text-xs md:text-sm">
            {lines.map((line, lIdx) => (
              <li key={lIdx} className="leading-relaxed marker:text-cyan-500">
                {renderPreviewInline(line.trim().replace(/^[-*•]\s+/, ''))}
              </li>
            ))}
          </ul>
        );
      }

      const isNumberedList = lines.every(l => /^\d+\.\s+/.test(l.trim()));
      if (isNumberedList) {
        return (
          <ol key={chunkIdx} className="my-2.5 space-y-1 pl-5 list-decimal text-slate-700 dark:text-slate-300 text-xs md:text-sm">
            {lines.map((line, lIdx) => (
              <li key={lIdx} className="leading-relaxed marker:text-cyan-600 font-medium">
                {renderPreviewInline(line.trim().replace(/^\d+\.\s+/, ''))}
              </li>
            ))}
          </ol>
        );
      }

      return (
        <p key={chunkIdx} className="mb-2.5 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300 text-xs md:text-sm">
          {lines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {renderPreviewInline(line)}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  }, [text]);

  if (!text?.trim()) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs italic p-6">
        ยังไม่มีเนื้อหาที่จะแสดงตัวอย่าง...
      </div>
    );
  }

  return <div className="space-y-1">{blocks}</div>;
}

export default function ProductDescriptionEditor({ value = '', onChange }) {
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
  const [isMaximized, setIsMaximized] = useState(false);
  const textareaRef = useRef(null);

  // Helper to insert or wrap markdown at cursor position
  const handleInsert = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    const currentVal = value || '';

    if (!textarea) {
      onChange(currentVal + prefix + defaultText + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentVal.substring(start, end);
    const content = selected || defaultText;

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);
    const newVal = `${before}${prefix}${content}${suffix}${after}`;

    onChange(newVal);

    // Re-focus and position cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + content.length + suffix.length;
      textarea.setSelectionRange(
        selected ? newCursorPos : start + prefix.length,
        selected ? newCursorPos : start + prefix.length + content.length
      );
    }, 10);
  };

  const toolbarButtons = [
    {
      title: 'ตัวหนา (Bold)',
      icon: <Bold size={13} strokeWidth={2.5} />,
      action: () => handleInsert('**', '**', 'ข้อความตัวหนา')
    },
    {
      title: 'ตัวเอียง (Italic)',
      icon: <Italic size={13} strokeWidth={2.5} />,
      action: () => handleInsert('*', '*', 'ข้อความตัวเอียง')
    },
    {
      title: 'หัวข้อ (Heading 3)',
      icon: <Heading size={13} strokeWidth={2.5} />,
      action: () => handleInsert('### ', '', 'หัวข้อย่อย')
    },
    {
      title: 'รายการจุด (Bullet List)',
      icon: <List size={13} strokeWidth={2.5} />,
      action: () => handleInsert('- ', '', 'รายการ')
    },
    {
      title: 'รายการลำดับ (Numbered List)',
      icon: <ListOrdered size={13} strokeWidth={2.5} />,
      action: () => handleInsert('1. ', '', 'ขั้นตอนที่ 1')
    },
    {
      title: 'ข้อความเน้น (Quote)',
      icon: <Quote size={13} strokeWidth={2.5} />,
      action: () => handleInsert('> ', '', 'ข้อความเน้น')
    },
    {
      title: 'เส้นคั่น (Divider)',
      icon: <Minus size={13} strokeWidth={2.5} />,
      action: () => handleInsert('\n---\n', '', '')
    },
    {
      title: 'ขึ้นย่อหน้าใหม่ (Paragraph Break)',
      icon: <CornerDownLeft size={13} strokeWidth={2.5} />,
      action: () => handleInsert('\n\n', '', '')
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Header bar: Label + Toolbar + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Full Description (รายละเอียดเชิงลึก)
        </label>

        <div className="flex items-center gap-1.5">
          {/* Tab switcher: Edit vs Preview */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-[2px] border border-slate-300 dark:border-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-[2px] transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Edit3 size={11} /> เขียน
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-[2px] transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Eye size={11} /> ดูตัวอย่าง
            </button>
          </div>

          {/* Maximize / Zen mode button */}
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="px-2 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-[2px] border border-slate-300 dark:border-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
            title={isMaximized ? 'ย่อขนาดกลับ' : 'ขยายเต็มตาเพื่อจัดหน้าง่ายขึ้น'}
          >
            {isMaximized ? (
              <>
                <Minimize2 size={12} /> <span className="hidden sm:inline">ย่อลง</span>
              </>
            ) : (
              <>
                <Maximize2 size={12} /> <span className="hidden sm:inline">ขยายดูกว้างขึ้น</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Box */}
      <div className={`border border-slate-300 dark:border-slate-600 rounded-[2px] bg-white dark:bg-slate-900 transition-all flex flex-col ${
        isMaximized ? 'fixed inset-4 z-50 shadow-2xl p-4 bg-white dark:bg-slate-900 border-2 border-slate-400' : ''
      }`}>
        {/* If maximized, show top bar with Close button */}
        {isMaximized && (
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                ✏️ โหมดขยายพื้นที่: จัดระเบียบเนื้อหานำเสนอสินค้า (Full Description)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                (ฝั่งซ้าย: พิมพ์จัดรูปแบบ / ฝั่งขวา: แสดงตัวอย่างทันที)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMaximized(false)}
              className="p-1 rounded-[2px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              title="ปิดโหมดขยาย"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 rounded-t-[2px]">
          {toolbarButtons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              className="p-1.5 rounded-[2px] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center justify-center active:scale-95"
              title={btn.title}
            >
              {btn.icon}
            </button>
          ))}
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />
          <span className="text-[10px] text-slate-500 dark:text-slate-400 select-none">
            รองรับ ขึ้นบรรทัดใหม่ / ย่อหน้า / ตัวหนา **คำ** / หัวข้อ ### / รายการ -
          </span>
        </div>

        {/* Body content: Normal mode vs Maximized Split View */}
        {isMaximized ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden p-2">
            {/* Left: Textarea */}
            <div className="flex flex-col h-full">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                ช่องพิมพ์ข้อความ (สามารถใช้ปุ่มเครื่องมือด้านบนช่วยจัดฟอร์แมต)
              </div>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="ลงรายละเอียดเชิงลึก คุณสมบัติ จุดเด่น วิธีการใช้งาน การรับประกัน ฯลฯ..."
                className="w-full flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-[2px] bg-slate-50/50 dark:bg-slate-950 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden resize-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all font-mono custom-scrollbar"
              />
            </div>
            {/* Right: Live Preview */}
            <div className="flex flex-col h-full border border-slate-300 dark:border-slate-700 rounded-[2px] bg-white dark:bg-slate-950 p-4 overflow-y-auto custom-scrollbar">
              <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                🔍 ตัวอย่างการแสดงผลหน้าเว็บจริง (Live Preview)
              </div>
              <DescriptionPreview text={value} />
            </div>
          </div>
        ) : activeTab === 'edit' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="ลงรายละเอียดเชิงลึก คุณสมบัติ จุดเด่น วิธีการใช้งาน... (ลากมุมขวาล่างเพื่อขยายความสูงได้)"
            className="w-full p-3 bg-white dark:bg-slate-900 focus:border-slate-800 dark:focus:border-orange-500 outline-hidden resize-y min-h-[140px] text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all custom-scrollbar"
          />
        ) : (
          <div className="p-4 min-h-[140px] max-h-[300px] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 custom-scrollbar">
            <DescriptionPreview text={value} />
          </div>
        )}
      </div>
    </div>
  );
}
