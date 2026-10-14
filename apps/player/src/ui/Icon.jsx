/** Jeu d'icônes au trait, dessinées à la main pour rester légères. */
const PATHS = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  games: <><path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L14 15h-4l-1 .6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z" /><path d="M7 11v3M5.5 12.5h3M16 12h.01M18 14h.01" /></>,
  sport: <><circle cx="12" cy="12" r="9" /><path d="M12 7l4 3-1.5 5h-5L8 10z" /></>,
  bets: <><path d="M5 4h14v16l-3-2-2 2-2-2-2 2-2-2-3 2z" /><path d="M9 9h6M9 13h4" /></>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2M6 6l9-3 2 3" /></>,
  history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  down: <path d="M12 4v14M6 12l6 6 6-6" />,
  up: <path d="M12 20V6M6 12l6-6 6 6" />,
  phone: <><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></>,
  shield: <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />,
  logout: <><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M10 16l-4-4 4-4M6 12h10" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  gift: <><rect x="3" y="9" width="18" height="4" rx="1" /><path d="M5 13v8h14v-8M12 9v12M12 9C9 9 7 7.5 8 5.5S12 6 12 9zm0 0c3 0 5-1.5 4-3.5S12 6 12 9z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 13h3" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
};

export function Icon({ name, size = 20, strokeWidth = 1.8, className, title }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
