// =========================================
// SIDEBAR
// Sistem Informasi Punguan Gultom
// =========================================

function Sidebar({ activeMenu, setActiveMenu }) {
  const menuItems = [
    {
      name: 'Dashboard',
      icon: '▦',
    },
    {
      name: 'Anggota',
      icon: '♟',
    },
    {
      name: 'Koordinator Wilayah',
      icon: '◆',
    },
    {
      name: 'Iuran Tahunan',
      icon: '▤',
    },
    {
      name: 'Kegiatan',
      icon: '◷',
    },
    {
      name: 'Admin',
      icon: '⚙️',
    },
  ]

  return (
    <aside className="sidebar">

      {/* =========================================
          LOGO
      ========================================= */}

      <div className="logo-area">

        <img
          src="/logo.jpeg"
          alt="Logo Punguan Gultom"
          className="logo-image"
        />

        <div className="logo-text">

          <div className="logo-title">
            Punguan Gultom
          </div>

          <div className="logo-subtitle">
            Boru - Bere - Ibebere
          </div>

        </div>

      </div>


      {/* =========================================
          MENU UTAMA
      ========================================= */}

      <nav className="sidebar-menu">

        <div className="menu-label">
          Menu Utama
        </div>

        {menuItems.map((item) => (

          <button
            key={item.name}
            type="button"
            className={`menu-item ${
              activeMenu === item.name ? 'active' : ''
            }`}
            onClick={() => setActiveMenu(item.name)}
          >

            <span className="menu-icon">
              {item.icon}
            </span>

            <span className="menu-text">
              {item.name}
            </span>

          </button>

        ))}

      </nav>


      {/* =========================================
          ARSIP
      ========================================= */}

      <nav className="sidebar-menu">

        <div className="menu-label">
          Arsip
        </div>


        {/* AD / ART */}

        <button
          type="button"
          className={`menu-item ${
            activeMenu === 'AD/RT'
              ? 'active'
              : ''
          }`}
          onClick={() => setActiveMenu('AD/RT')}
        >

          <span className="menu-icon">
            ▱
          </span>

          <span className="menu-text">
            AD/RT
          </span>

        </button>


        {/* DOKUMEN PENTING */}

        <button
          type="button"
          className={`menu-item ${
            activeMenu === 'Dokumen Penting'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setActiveMenu('Dokumen Penting')
          }
        >

          <span className="menu-icon">
            ▤
          </span>

          <span className="menu-text">
            Dokumen Penting
          </span>

        </button>

      </nav>


      {/* =========================================
          SIDEBAR FOOTER
      ========================================= */}

      <div className="sidebar-footer">

        <div className="footer-line">
        </div>

        <div className="admin-name">
          Admin Organisasi
        </div>

        <div className="admin-role">
          Super Administrator
        </div>

      </div>

    </aside>
  )
}

export default Sidebar