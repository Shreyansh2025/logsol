import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import Icon from './Icon'

const groups = [
  {
    label: 'WORKSPACE',
    items: [
      { to: '/', label: 'Dashboard', icon: 'grid' },
      { to: '/match', label: 'AI Material Matching', icon: 'spark' },
      { to: '/review', label: 'Duplicate Review', icon: 'review' },
    ],
  },
  {
    label: 'MASTER DATA',
    items: [
      { to: '/generator', label: 'National Code Generator', icon: 'code' },
      { to: '/catalog', label: 'Material Catalog', icon: 'database' },
      { to: '/mapping', label: 'CPSE Mapping', icon: 'layers' },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { to: '/audit', label: 'Audit Trail', icon: 'activity' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/upload', label: 'Data Ingestion', icon: 'upload' },
      { to: '/integration', label: 'Integration', icon: 'link' },
    ],
  },
]

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark"><Icon name="layers" size={21} /></div>
          {!collapsed && <div className="brand-copy"><strong>Material Master</strong><span>National Unified Platform</span></div>}
        </div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(v => !v)} aria-label="Toggle navigation">
          <Icon name="chevrondown" size={14} className={collapsed ? 'rotate-270' : 'rotate-90'} />
        </button>
        <nav className="sidebar-nav">
          {groups.map(group => (
            <div className="nav-group" key={group.label}>
              {!collapsed && <div className="nav-group-label">{group.label}</div>}
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
                  <Icon name={item.icon} size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="system-status"><span className="status-dot" /> AI engine online</div>
            <div className="sidebar-version">SIH 2026 · PS 26099</div>
          </div>
        )}
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="global-search"><Icon name="search" size={17}/><span>Search materials, CPSE codes, descriptions…</span><kbd>⌘ K</kbd></div>
          <div className="topbar-actions">
            <div className="ai-pill"><span className="status-dot" /> AI Engine Online</div>
            <button className="icon-button" aria-label="Notifications"><Icon name="bell" size={18}/><span className="notification-dot"/></button>
            <div className="profile-chip"><div className="avatar">MM</div><div className="profile-copy"><strong>Material Admin</strong><span>Administrator</span></div><Icon name="chevrondown" size={13}/></div>
          </div>
        </header>
        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}
