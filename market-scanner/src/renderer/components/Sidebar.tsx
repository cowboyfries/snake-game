import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/trending', label: 'Trending', icon: '🔥' },
  { path: '/news', label: 'News', icon: '📰' },
  { path: '/alerts', label: 'Alerts', icon: '🔔' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 200,
    minHeight: '100vh',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
  },
  logo: {
    padding: '8px 20px 24px',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '0.5px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 20px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background 0.15s, color 0.15s',
    borderLeft: '3px solid transparent',
  },
  activeLink: {
    color: 'var(--accent)',
    background: 'var(--bg-hover)',
    borderLeftColor: 'var(--accent)',
  },
};

export default function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>Market Scanner</div>
      <nav style={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.activeLink : {}),
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
