// =========================================
// DASHBOARD PAGE
// Sistem Informasi Punguan Gultom
// =========================================

import { useState } from 'react'

function Dashboard() {

  // =========================================
  // SEARCH
  // =========================================

  const [search, setSearch] = useState('')


  // =========================================
  // DATA ANGGOTA TERBARU
  // =========================================

  const members = [
    {
      initials: 'AS',
      name: 'Ardian Saputra',
      wilayah: 'Jakarta Selatan',
      iuran: 'Lunas',
      date: '18 Agu 2026',
      status: 'success',
    },

    {
      initials: 'NA',
      name: 'Nadia Aulia',
      wilayah: 'Jakarta Timur',
      iuran: 'Lunas',
      date: '15 Agu 2026',
      status: 'success',
    },

    {
      initials: 'RP',
      name: 'Rizky Pratama',
      wilayah: 'Bekasi',
      iuran: 'Menunggu',
      date: '12 Agu 2026',
      status: 'info',
    },

    {
      initials: 'SM',
      name: 'Siti Mulyani',
      wilayah: 'Tangerang',
      iuran: 'Belum Lunas',
      date: '08 Agu 2026',
      status: 'warning',
    },
  ]


  // =========================================
  // DATA KEGIATAN
  // =========================================

  const activities = [
    {
      title: 'Doa bersama dan arisan',
      description:
        'Jakarta Selatan • 18 Agu 2026',
      color: 'green',
    },

    {
      title: 'Silaturahmi wilayah Bekasi',
      description:
        'Dokumentasi 18 foto • 10 Agu 2026',
      color: 'blue',
    },

    {
      title: 'Rapat pengurus wilayah',
      description:
        'Jakarta Timur • 04 Agu 2026',
      color: 'orange',
    },
  ]


  // =========================================
  // DATA WILAYAH
  // =========================================

  const regions = [
    {
      name: 'Jakarta Selatan',
      value: 42,
      width: '100%',
    },

    {
      name: 'Jakarta Timur',
      value: 35,
      width: '83%',
    },

    {
      name: 'Bekasi',
      value: 30,
      width: '71%',
    },

    {
      name: 'Tangerang',
      value: 22,
      width: '52%',
    },
  ]


  // =========================================
  // FILTER ANGGOTA
  // =========================================

  const filteredMembers = members.filter(
    (member) =>
      member.name
        .toLowerCase()
        .includes(search.toLowerCase())
  )


  // =========================================
  // RENDER
  // =========================================

  return (
    <>

      {/* =====================================
          PAGE HEADER
      ====================================== */}

      <div className="content-header">

        <div>

          <h1>
            Dashboard Organisasi
          </h1>

          <p>
            Ringkasan keanggotaan, iuran,
            keuangan, dan kegiatan Punguan Gultom.
          </p>

        </div>


        <div className="header-actions">

          <button className="btn btn-secondary">
            ↓ &nbsp; Export Data
          </button>

          <button className="btn btn-primary">
            + Tambah Anggota
          </button>

        </div>

      </div>


      {/* =====================================
          KPI CARDS
      ====================================== */}

      <section className="stats-grid">


        {/* TOTAL ANGGOTA */}

        <div className="stat-card stat-members">

          <div className="stat-top">

            <div className="stat-label">
              Total Anggota
            </div>

            <div className="stat-icon">
              ♟
            </div>

          </div>

          <div className="stat-value">
            248
          </div>

          <div className="stat-change success-text">
            Data anggota aktif
          </div>

        </div>


        {/* KOORDINATOR WILAYAH */}

        <div className="stat-card stat-balance">

          <div className="stat-top">

            <div className="stat-label">
              Koordinator Wilayah
            </div>

            <div className="stat-icon">
              ◆
            </div>

          </div>

          <div className="stat-value">
            8
          </div>

          <div className="stat-change success-text">
            Mencakup 8 wilayah aktif
          </div>

        </div>


        {/* IURAN LUNAS */}

        <div className="stat-card stat-income">

          <div className="stat-top">

            <div className="stat-label">
              Iuran Lunas 2026
            </div>

            <div className="stat-icon">
              ✓
            </div>

          </div>

          <div className="stat-value">
            210
          </div>

          <div className="stat-change success-text">
            84,7% dari total anggota
          </div>

        </div>


        {/* BELUM LUNAS */}

        <div className="stat-card stat-expense">

          <div className="stat-top">

            <div className="stat-label">
              Belum Melunasi Iuran
            </div>

            <div className="stat-icon">
              !
            </div>

          </div>

          <div className="stat-value">
            38
          </div>

          <div className="stat-change warning-text">
            Perlu ditindaklanjuti
          </div>

        </div>

      </section>


      {/* =====================================
          MEMBER + ACTIVITY
      ====================================== */}

      <section className="dashboard-grid">


        {/* ===================================
            MEMBER TABLE
        ==================================== */}

        <div className="card">

          <div className="card-header">

            <div>

              <h3 className="card-title">
                Data Anggota Terbaru
              </h3>

            </div>


            <div className="search-box">

              <input
                type="text"
                placeholder="Cari nama anggota..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

          </div>


          <div className="table-wrapper">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    ANGGOTA
                  </th>

                  <th>
                    WILAYAH
                  </th>

                  <th>
                    IURAN
                  </th>

                  <th>
                    BERGABUNG
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredMembers.map(
                  (member) => (

                    <tr key={member.name}>

                      <td>

                        <div className="member-cell">

                          <div className="member-avatar">
                            {member.initials}
                          </div>

                          <span className="member-name">
                            {member.name}
                          </span>

                        </div>

                      </td>


                      <td>
                        {member.wilayah}
                      </td>


                      <td>

                        <span
                          className={`badge badge-${member.status}`}
                        >
                          {member.iuran}
                        </span>

                      </td>


                      <td>
                        {member.date}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>


            {filteredMembers.length === 0 && (

              <div className="empty-search">
                Anggota tidak ditemukan.
              </div>

            )}

          </div>

        </div>


        {/* ===================================
            ACTIVITIES
        ==================================== */}

        <div className="card">

          <div className="card-header">

            <div>

              <h3 className="card-title">
                Kegiatan Punguan
              </h3>

              <div className="card-subtitle">
                Kegiatan terbaru
              </div>

            </div>

          </div>


          <div className="activity-list">

            {activities.map(
              (activity) => (

                <div
                  className="activity-item"
                  key={activity.title}
                >

                  <span
                    className={`activity-dot ${activity.color}`}
                  >
                  </span>


                  <div className="activity-content">

                    <div className="activity-title">
                      {activity.title}
                    </div>

                    <div className="activity-description">
                      {activity.description}
                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================
          REGION
      ====================================== */}

      <section className="card region-card">

        <div className="card-header">

          <div>

            <h3 className="card-title">
              Anggota per Wilayah
            </h3>

          </div>

        </div>


        <div className="region-list">

          {regions.map(
            (region) => (

              <div
                className="region-row"
                key={region.name}
              >

                <div className="region-name">
                  {region.name}
                </div>


                <div className="progress-container">

                  <div className="progress-background">

                    <div
                      className="progress-bar"
                      style={{
                        width: region.width,
                      }}
                    >
                    </div>

                  </div>

                </div>


                <div className="region-value">
                  {region.value}
                </div>

              </div>

            )
          )}

        </div>

      </section>

    </>
  )
}

export default Dashboard