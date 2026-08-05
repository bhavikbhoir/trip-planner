// Custom line-icon sprite — replaces emoji everywhere in the UI.
// IconSprite renders the <defs> once (mount near the app root);
// Icon renders a single <use> reference to one of those symbols.

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="icon-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M14.5 9.5 12.8 14l-4.5 1.7L10 11.2z" /></symbol>
        <symbol id="icon-link" viewBox="0 0 24 24"><path d="M9 15 15 9" /><path d="M11 6.5 12.5 5a3.5 3.5 0 0 1 5 5L16 11.5" /><path d="M13 17.5 11.5 19a3.5 3.5 0 0 1-5-5L8 12.5" /></symbol>
        <symbol id="icon-sliders" viewBox="0 0 24 24"><path d="M4 6h10M17 6h3M4 12h3M9 12h11M4 18h13M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="7" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></symbol>
        <symbol id="icon-route" viewBox="0 0 24 24"><circle cx="5" cy="6" r="2.2" /><circle cx="19" cy="18" r="2.2" /><path d="M6.5 7.5C9 10 8 13 11 14.5s5.5 0.5 6.5 2" /></symbol>
        <symbol id="icon-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M8 12.5 10.7 15 16 9.5" /></symbol>
        <symbol id="icon-plane" viewBox="0 0 24 24"><path d="M3 13.5 21 7l-6 6.5 1 6-3-3-3 3-1-5-6-1 4-3-3-.5z" strokeLinejoin="round" /></symbol>
        <symbol id="icon-pin" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.3" /></symbol>
        <symbol id="icon-bed" viewBox="0 0 24 24"><path d="M3 18v-7a2 2 0 0 1 2-2h5v4" /><path d="M3 18v2M21 18v2" /><path d="M3 15h18v-1a3 3 0 0 0-3-3h-6" /></symbol>
        <symbol id="icon-car" viewBox="0 0 24 24"><path d="M4 16V12l2-5h12l2 5v4" /><path d="M4 16h16v2H4z" /><circle cx="8" cy="18" r="1.4" /><circle cx="16" cy="18" r="1.4" /></symbol>
        <symbol id="icon-fork" viewBox="0 0 24 24"><path d="M8 3v7a2 2 0 0 0 4 0V3M10 10v11M16 3c-1.5 0-2 2-2 4s.5 4 2 4 2-2 2-4-.5-4-2-4zM16 11v10" /></symbol>
        <symbol id="icon-mountain" viewBox="0 0 24 24"><path d="M3 19 9 8l4 6.5L15 11l6 8z" /></symbol>
        <symbol id="icon-wallet" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M16 12h3M15 12a1.5 1.5 0 1 0 0 .01" /></symbol>
        <symbol id="icon-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.2c2.3.5 4 2.4 4.5 5.8" /></symbol>
        <symbol id="icon-heart" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-9.3-9.3C1.6 7 3.6 4 7 4c2 0 3.6 1.2 5 3 1.4-1.8 3-3 5-3 3.4 0 5.4 3 4.3 6.7C19.5 15.4 12 20 12 20z" /></symbol>
        <symbol id="icon-sparkle" viewBox="0 0 24 24"><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" /></symbol>
        <symbol id="icon-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></symbol>
        <symbol id="icon-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></symbol>
        <symbol id="icon-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z" /></symbol>
        <symbol id="icon-thumb" viewBox="0 0 24 24"><path d="M7 20V10M2 12v6a2 2 0 0 0 2 2h2M7 10l4-7c1.5 0 2 1 2 2v4h5a2 2 0 0 1 2 2.3l-1.5 6A2 2 0 0 1 18.5 20H7" /></symbol>
        <symbol id="icon-flag" viewBox="0 0 24 24"><path d="M5 21V4" /><path d="M5 4h13l-3 4 3 4H5" /></symbol>
        <symbol id="icon-refresh" viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" /><path d="M18 4v4h-4M6 20v-4h4" /></symbol>
        <symbol id="icon-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></symbol>
        <symbol id="icon-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></symbol>
        <symbol id="icon-baby" viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.2" /><path d="M6 20c0-4 2.5-6.5 6-6.5s6 2.5 6 6.5" /><path d="M9.5 6c0-1.5 3-1.5 3-3" /></symbol>
        <symbol id="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></symbol>
        <symbol id="icon-map" viewBox="0 0 24 24"><path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" strokeLinejoin="round" /><path d="M9 4v13M15 6.5v13" /></symbol>
        <symbol id="icon-bell" viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 3.5 1 5.5 2 7H4c1-1.5 2-3.5 2-7z" strokeLinejoin="round" /><path d="M9.5 19a2.5 2.5 0 0 0 5 0" /></symbol>
        <symbol id="icon-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinejoin="round" /></symbol>
      </defs>
    </svg>
  )
}

export function Icon({ name, className = '' }) {
  return (
    <svg className={`icon ${className}`.trim()} aria-hidden="true">
      <use href={`#icon-${name}`} />
    </svg>
  )
}
