// 최소한의 선 아이콘. 외부 아이콘 라이브러리 없이 인라인 SVG로 둔다.
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

export const IconLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)
export const IconRight = (p) => (
  <svg {...base} {...p}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)
export const IconHome = (p) => (
  <svg {...base} {...p}>
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
  </svg>
)
export const IconPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconMinus = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
)
export const IconFit = (p) => (
  <svg {...base} {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
)
export const IconFullscreen = (p) => (
  <svg {...base} {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
  </svg>
)
export const IconGrid = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
  </svg>
)
export const IconSpread = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5.5C10 4 7.5 3.6 4 4v15c3.5-.4 6 0 8 1.5 2-1.5 4.5-1.9 8-1.5V4c-3.5-.4-6 0-8 1.5z" />
    <path d="M12 5.5v15" />
  </svg>
)
export const IconSingle = (p) => (
  <svg {...base} {...p}>
    <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
  </svg>
)
export const IconBookmark = ({ filled, ...p }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M6.5 3.5h11v17l-5.5-4-5.5 4v-17z" />
  </svg>
)
export const IconBulb = (p) => (
  <svg {...base} {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 00-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0012 3z" />
  </svg>
)
export const IconCaret = (p) => (
  <svg {...base} width="16" height="16" {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
)
export const IconPresent = (p) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="4" width="19" height="12.5" rx="1.5" />
    <path d="M12 16.5V20M8.5 20h7" />
  </svg>
)
export const IconClose = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const IconLock = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="1.8" />
    <path d="M8 10.5V7.5a4 4 0 018 0v3" />
  </svg>
)
export const IconPencil = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20h4L19 9a2.1 2.1 0 00-3-3L5 17v3z" />
  </svg>
)
