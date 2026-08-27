// =========================================
// TOPBAR
// Sistem Informasi Punguan Gultom
// =========================================

function Topbar({ activeMenu }) {

  // =========================================
  // JUDUL DAN DESKRIPSI BERDASARKAN MENU
  // =========================================

  const pageInformation = {
    Dashboard: {
      title: 'Dashboard',
      description: 'Sistem Informasi Punguan Gultom',
    },

    Anggota: {
      title: 'Daftar Anggota',
      description: 'Data anggota dan keluarga Punguan Gultom',
    },

    Keuangan: {
      title: 'Keuangan',
      description: 'Pengelolaan keuangan Punguan Gultom',
    },

    Kegiatan: {
      title: 'Kegiatan Punguan',
      description: 'Agenda dan dokumentasi kegiatan Punguan Gultom',
    },

    Iuran: {
      title: 'Iuran Tahunan',
      description: 'Pengelolaan iuran tahunan anggota',
    },

    Laporan: {
      title: 'Laporan',
      description: 'Laporan dan rekapitulasi organisasi',
    },
  }

  // =========================================
  // AMBIL INFORMASI HALAMAN AKTIF
  // =========================================

  const currentPage =
    pageInformation[activeMenu] ||
    pageInformation.Dashboard

  // =========================================
  // RENDER
  // =========================================

  return (
    <header className="topbar">

      {/* =====================================
          LEFT
      ====================================== */}

      <div className="topbar-left">

        <h2 className="page-title">
          {currentPage.title}
        </h2>

        <div className="page-description">
          {currentPage.description}
        </div>

      </div>


      {/* =====================================
          RIGHT / USER
      ====================================== */}

      <div className="user-area">

        <div className="user-info">

          <div className="user-name">
            Administrator
          </div>

          <div className="user-role">
            Admin
          </div>

        </div>


        <div className="avatar">
          A
        </div>

      </div>

    </header>
  )
}

export default Topbar