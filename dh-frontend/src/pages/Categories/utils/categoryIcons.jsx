import React from 'react';

export const CATEGORY_GROUPS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'screen-kb', label: 'จอ & คีย์บอร์ด' },
  { id: 'power-cool', label: 'ไฟ & ระบบระบายความร้อน' },
  { id: 'cable-body', label: 'สายแพ & โครงเครื่อง' }
];

const SVG_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.85,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true'
};

export const CATEGORY_ICON_SVGS = {
  speaker: (
    <svg {...SVG_PROPS}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="14" r="4" />
      <line x1="12" y1="6" x2="12.01" y2="6" />
    </svg>
  ),
  adapter: (
    <svg {...SVG_PROPS}>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  ),
  display: (
    <svg {...SVG_PROPS}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  ),
  cable: (
    <svg {...SVG_PROPS}>
      <path d="M19 15V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V9" />
      <rect x="2" y="4" width="6" height="5" rx="1" />
      <rect x="16" y="15" width="6" height="5" rx="1" />
    </svg>
  ),
  fan: (
    <svg {...SVG_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 3c2 2 2 5 0 7M21 12c-2 2-5 2-7 0M12 21c-2-2-2-5 0-7M3 12c2-2 5-2 7 0" />
    </svg>
  ),
  keyboard: (
    <svg {...SVG_PROPS}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
    </svg>
  ),
  hinge: (
    <svg {...SVG_PROPS}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  cooling: (
    <svg {...SVG_PROPS}>
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
    </svg>
  ),
  builtin: (
    <svg {...SVG_PROPS}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" />
    </svg>
  ),
  switching: (
    <svg {...SVG_PROPS}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  screen: (
    <svg {...SVG_PROPS}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M2 20h20" />
    </svg>
  ),
  other: (
    <svg {...SVG_PROPS}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
};

export const getCategoryMeta = (category = {}) => {
  const raw = `${category.name || ''} ${category.type || ''}`.toLowerCase();

  if (raw.includes('built') && raw.includes('adapter')) {
    return { iconKey: 'builtin', group: 'power-cool' };
  }
  if (raw.includes('switching') || raw.includes('power supply')) {
    return { iconKey: 'switching', group: 'power-cool' };
  }
  if (raw.includes('adapter') || raw.includes('ชาร์จ') || raw.includes('charger')) {
    return { iconKey: 'adapter', group: 'power-cool' };
  }
  if (raw.includes('fan') || raw.includes('พัดลม')) {
    return { iconKey: 'fan', group: 'power-cool' };
  }
  if (raw.includes('cooling') || raw.includes('ซิลิโคน') || raw.includes('ซิงค์')) {
    return { iconKey: 'cooling', group: 'power-cool' };
  }
  if (raw.includes('keyboard') || raw.includes('คีย์บอร์ด')) {
    return { iconKey: 'keyboard', group: 'screen-kb' };
  }
  if (raw.includes('หน้าจอ') || raw.includes('display') || raw.includes('panel') || raw.includes('lcd')) {
    return { iconKey: 'display', group: 'screen-kb' };
  }
  if (raw.includes('screen') || raw.includes('จอ')) {
    return { iconKey: 'screen', group: 'screen-kb' };
  }
  if (raw.includes('cable') || raw.includes('สายแพ') || raw.includes('สาย')) {
    return { iconKey: 'cable', group: 'cable-body' };
  }
  if (raw.includes('ลำโพง') || raw.includes('speaker') || raw.includes('audio')) {
    return { iconKey: 'speaker', group: 'cable-body' };
  }
  if (raw.includes('hinge') || raw.includes('บานพับ')) {
    return { iconKey: 'hinge', group: 'cable-body' };
  }

  return { iconKey: 'other', group: 'cable-body' };
};

export const CategorySvgIcon = ({ category }) => {
  const { iconKey } = getCategoryMeta(category);
  return CATEGORY_ICON_SVGS[iconKey] || CATEGORY_ICON_SVGS.other;
};
