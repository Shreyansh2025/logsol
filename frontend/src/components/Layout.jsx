  import { NavLink, useLocation, useNavigate } from 'react-router-dom'
  import { useEffect, useState } from 'react'
  import Icon from './Icon'

  const groups = [
    { label: 'WORKSPACE', items: [
      { to: '/', label: 'Dashboard', icon: 'grid' },
      { to: '/match', label: 'AI Material Matching', icon: 'spark' },
      { to: '/review', label: 'Duplicate Review', icon: 'review' },
    ]},
    { label: 'MASTER DATA', items: [
      { to: '/generator', label: 'National Code Generator', icon: 'code' },
      { to: '/catalog', label: 'Material Catalog', icon: 'database' },
      { to: '/mapping', label: 'CPSE Mapping', icon: 'layers' },
    ]},
    { label: 'GOVERNANCE', items: [{ to: '/audit', label: 'Audit Trail', icon: 'activity' }] },
    { label: 'SYSTEM', items: [
      { to: '/upload', label: 'Data Ingestion', icon: 'upload' },
      { to: '/integration', label: 'Integration', icon: 'link' },
    ]},
  ]

  export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(false)
    const [search, setSearch] = useState('')
    const [pendingCount, setPendingCount] = useState(0)

    useEffect(() => {
      const syncPending = () => {
        try { setPendingCount(localStorage.getItem('material_master_pending_review') ? 1 : 0) } catch { setPendingCount(0) }
      }
      syncPending()
      window.addEventListener('material-pending-review', syncPending)
      window.addEventListener('storage', syncPending)
      return () => {
        window.removeEventListener('material-pending-review', syncPending)
        window.removeEventListener('storage', syncPending)
      }
    }, [])
    const location = useLocation()
    const navigate = useNavigate()

    const runGlobalSearch = (event) => {
      event?.preventDefault()
      const q = search.trim()
      if (!q) return
      navigate(`/match?q=${encodeURIComponent(q)}`)
    }

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
              <div className="nav-group " key={group.label}>
                {!collapsed && <div className="nav-group-label">{group.label}</div>}
                {group.items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
                    <span className="nav-icon-wrap"><Icon name={item.icon} size={18} /></span>
                    {!collapsed && <><span>{item.label}</span>{item.to === '/review' && pendingCount > 0 && <span className="nav-pending-badge">1</span>}<span className="nav-glow"/></>}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          {!collapsed && <div className="sidebar-footer">
            <div className="system-status"><span className="status-dot status-dot-live" /> AI engine online</div>
            <div className="sidebar-version">SIH 2026 · PS 26099</div>
          </div>}
        </aside>

        <div className="main-area">
          <header className="topbar">
            <form className="global-search global-search-active" onSubmit={runGlobalSearch}>
              <Icon name="search" size={17}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search materials, CPSE codes, descriptions…" aria-label="Search materials" />
              <kbd>⌘ K</kbd>
            </form>
            <div className="topbar-actions">
              <div className="ai-pill"><span className="status-dot status-dot-live" /> AI Engine Online</div>
              <button className="icon-button" aria-label="Notifications"><Icon name="bell" size={18}/><span className="notification-dot"/></button>
              <div className="profile-chip"><div className="avatar">MM</div><div className="profile-copy"><strong>Material Admin</strong><span>Administrator</span></div><Icon name="chevrondown" size={13}/></div>
            </div>
          </header>
          <div className="ambient ambient-one" aria-hidden="true"/><div className="ambient ambient-two" aria-hidden="true"/>
          <main className="content-area">
            <div key={location.pathname + location.search} className="page-transition">{children}</div>
          </main>
        </div>
      </div>
    )
  }
