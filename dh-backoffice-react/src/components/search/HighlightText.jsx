import React from 'react';

export const HighlightText = ({ text, highlightData }) => {
  if (!text) return <span className="text-dh-muted opacity-70">n/a</span>;
  
  if (Array.isArray(text)) {
    return text.length > 0 ? text.map((item, index) => (
      <span key={index}>
        <HighlightText text={item} highlightData={highlightData} />
        {index < text.length - 1 ? ', ' : ''}
      </span>
    )) : <span className="text-dh-muted opacity-70">n/a</span>;
  }

  if (typeof text !== 'string') return text;

  let parts = [{ text, isMatch: false, className: '' }];

  highlightData.forEach(({ term, colorClass }) => {
    if (!term.trim()) return;
    const lowerTerm = term.toLowerCase();
    let newParts = [];

    parts.forEach(part => {
      if (part.isMatch) {
        newParts.push(part);
        return;
      }

      const lowerPart = part.text.toLowerCase();
      let start = 0;
      let matchIdx = lowerPart.indexOf(lowerTerm, start);

      while (matchIdx !== -1) {
        if (matchIdx > start) {
          newParts.push({ text: part.text.slice(start, matchIdx), isMatch: false, className: '' });
        }
        newParts.push({ text: part.text.slice(matchIdx, matchIdx + term.length), isMatch: true, className: colorClass });
        start = matchIdx + term.length;
        matchIdx = lowerPart.indexOf(lowerTerm, start);
      }
      if (start < part.text.length) {
        newParts.push({ text: part.text.slice(start), isMatch: false, className: '' });
      }
    });
    parts = newParts;
  });

  return (
    <>
      {parts.map((part, i) => (
        <span key={i} className={part.isMatch ? `${part.className} rounded-[4px] px-1 py-0.5` : ''}>{part.text}</span>
      ))}
    </>
  );
};
