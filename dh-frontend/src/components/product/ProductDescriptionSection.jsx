import React, { useMemo } from 'react';
import { AlignLeft } from 'lucide-react';

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and basic safe tags
 */
function renderInlineFormatting(text) {
  if (!text) return null;

  // Split by inline formatting tokens
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|<br\s*\/?>|<\/?b>|<\/?strong>|<\/?i>|<\/?em>)/gi);

  return tokens.map((token, index) => {
    if (!token) return null;

    // Bold: **text**
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic: *text*
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      return (
        <em key={index} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    }
    // Inline code: `text`
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 text-cyan-700 font-mono text-xs">
          {token.slice(1, -1)}
        </code>
      );
    }
    // HTML line-breaks
    if (/^<br\s*\/?>$/i.test(token)) {
      return <br key={index} />;
    }
    // HTML bold/italic wrappers if encountered directly
    if (/^<(\/)?(b|strong)>$/i.test(token)) {
      return null;
    }
    if (/^<(\/)?(i|em)>$/i.test(token)) {
      return null;
    }

    return token;
  });
}

/**
 * Transforms raw description text into structured, beautiful presentation elements.
 * Fully supports:
 * - Line breaks & Paragraphs (\n and \n\n)
 * - Headings (###, ##, #)
 * - Bullet lists (- item, * item, • item)
 * - Numbered lists (1. item)
 * - Blockquotes (> quote)
 * - Horizontal rules (---)
 * - Inline formatting (bold, italic, code)
 */
export function FormattedDescriptionView({ text, className = '' }) {
  const blocks = useMemo(() => {
    if (!text || typeof text !== 'string') return [];

    // If text already contains complete HTML block elements, preserve them safely
    const hasComplexHtml = /<(p|div|table|ul|ol|h[1-6])[\s>]/i.test(text);
    if (hasComplexHtml) {
      return [
        <div 
          key="raw-html"
          className="product-description-content"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ];
    }

    // Normalize line endings
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split into chunks by 2 or more newlines (paragraphs / structural blocks)
    const rawChunks = normalized.split(/\n{2,}/);

    return rawChunks.map((chunk, chunkIdx) => {
      const trimmed = chunk.trim();
      if (!trimmed) return null;

      // 1. Horizontal divider
      if (/^[-*_]{3,}$/.test(trimmed)) {
        return <hr key={chunkIdx} className="my-5 border-slate-200" />;
      }

      // 2. Headings (#, ##, ###)
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        if (level === 1) {
          return (
            <h2 key={chunkIdx} className="text-lg md:text-xl font-bold text-slate-900 mt-5 mb-2.5 first:mt-0 tracking-wide border-b border-slate-200 pb-2">
              {renderInlineFormatting(headingText)}
            </h2>
          );
        }
        if (level === 2) {
          return (
            <h3 key={chunkIdx} className="text-base md:text-lg font-bold text-slate-800 mt-4 mb-2 first:mt-0 tracking-wide">
              {renderInlineFormatting(headingText)}
            </h3>
          );
        }
        return (
          <h4 key={chunkIdx} className="text-sm md:text-base font-bold text-slate-800 mt-3 mb-1.5 first:mt-0">
            {renderInlineFormatting(headingText)}
          </h4>
        );
      }

      // 3. Blockquote (> text)
      if (trimmed.startsWith('>')) {
        const quoteLines = trimmed
          .split('\n')
          .map(l => l.replace(/^>\s?/, ''))
          .join('\n');
        return (
          <blockquote key={chunkIdx} className="border-l-4 border-cyan-500 pl-4 py-2 my-3 bg-slate-50 text-slate-700 italic rounded-r text-sm">
            {quoteLines.split('\n').map((line, lIdx, arr) => (
              <React.Fragment key={lIdx}>
                {renderInlineFormatting(line)}
                {lIdx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </blockquote>
        );
      }

      const lines = trimmed.split('\n');

      // 4. Bullet List (- item, * item, • item)
      const isBulletList = lines.every(l => /^[-*•]\s+/.test(l.trim()));
      if (isBulletList) {
        return (
          <ul key={chunkIdx} className="my-3 space-y-1.5 pl-6 list-disc text-slate-700">
            {lines.map((line, lIdx) => {
              const itemContent = line.trim().replace(/^[-*•]\s+/, '');
              return (
                <li key={lIdx} className="leading-relaxed pl-1 marker:text-cyan-500">
                  {renderInlineFormatting(itemContent)}
                </li>
              );
            })}
          </ul>
        );
      }

      // 5. Numbered List (1. item, 2. item)
      const isNumberedList = lines.every(l => /^\d+\.\s+/.test(l.trim()));
      if (isNumberedList) {
        return (
          <ol key={chunkIdx} className="my-3 space-y-1.5 pl-6 list-decimal text-slate-700">
            {lines.map((line, lIdx) => {
              const itemContent = line.trim().replace(/^\d+\.\s+/, '');
              return (
                <li key={lIdx} className="leading-relaxed pl-1 marker:text-cyan-600 font-medium">
                  {renderInlineFormatting(itemContent)}
                </li>
              );
            })}
          </ol>
        );
      }

      // 6. Normal Paragraph with single newlines converted to <br />
      return (
        <p key={chunkIdx} className="mb-3 last:mb-0 leading-relaxed text-slate-700">
          {lines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {renderInlineFormatting(line)}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    });
  }, [text]);

  if (!blocks || blocks.length === 0) return null;

  return <div className={`product-description-formatted space-y-1 ${className}`}>{blocks}</div>;
}

export default function ProductDescriptionSection({ description }) {
  if (!description) return null;

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-md border border-slate-300 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
        <AlignLeft className="text-cyber-blue w-5 h-5" />
        <h3 className="font-bold text-slate-800 tracking-wide">รายละเอียดสินค้า (Full Description)</h3>
      </div>
      <div className="p-6 md:p-8 text-slate-700 text-sm md:text-base leading-relaxed">
        <FormattedDescriptionView text={description} />
      </div>
    </div>
  );
}
