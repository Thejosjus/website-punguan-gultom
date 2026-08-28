// =========================================
// DASHBOARD PAGE
// Sistem Informasi Punguan Gultom
// =========================================
//
// Versi:
// - Mempertahankan tampilan Dashboard lama
// - Data diambil dari storage.js
// - Tidak menggunakan data dummy
// - Mendukung perubahan data antar-tab
// =========================================

import { useEffect, useMemo, useState } from 'react'

import {
  getMembers,
  getKegiatan,
  getKoordinator,
  getIuran,
  subscribeStorage,
} from '../utils/storage'


// =========================================
// HELPER
// =========================================

function getValue(item, keys, fallback = '') {
  if (!item || typeof item !== 'object') {
    return fallback
  }

  for (const key of keys) {
    const value = item[key]

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    ) {
      return value
    }
  }

  return fallback
}


// =========================================
// FORMAT TANGGAL
// =========================================

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}


// =========================================
// NORMALIZE TEXT
// =========================================

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}


// =========================================
// INITIALS
// =========================================

function getInitials(name) {
  const safeName = String(name || '').trim()

  if (!safeName) {
    return 'AG'
  }

  const words = safeName
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 1) {
    return words[0]
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    words[0].charAt(0) +
    words[1].charAt(0)
  ).toUpperCase()
}


// =========================================
// SORT DATE
// =========================================

function getTimeValue(item) {
  if (!item || typeof item !== 'object') {
    return 0
  }

  const value = getValue(
    item,
    [
      'createdAt',
      'updatedAt',
      'tanggal',
      'date',
      'tanggalGabung',
      'tanggalKegiatan',
      'tanggalBayar',
    ],
    ''
  )

  if (!value) {
    return 0
  }

  const time = new Date(value).getTime()

  return Number.isNaN(time)
    ? 0
    : time
}


// =========================================
// MEMBER NAME
// =========================================

function getMemberName(member) {
  return getValue(
    member,
    [
      'nama',
      'name',
      'namaAnggota',
      'namaMember',
      'fullName',
      'fullname',
    ],
    'Tanpa Nama'
  )
}


// =========================================
// WILAYAH
// =========================================

function getMemberRegion(member) {
  return getValue(
    member,
    [
      'wilayah',
      'namaWilayah',
      'region',
      'daerah',
      'area',
      'domisili',
    ],
    'Belum Ditentukan'
  )
}


// =========================================
// STATUS IURAN
// =========================================

function normalizePaymentStatus(value) {
  const status = normalizeText(value)

  if (
    status === 'lunas' ||
    status === 'paid' ||
    status === 'sudah bayar' ||
    status === 'sudah dibayar' ||
    status === 'terbayar'
  ) {
    return 'lunas'
  }

  if (
    status === 'menunggu' ||
    status === 'pending'
  ) {
    return 'menunggu'
  }

  if (
    status === 'belum lunas' ||
    status === 'belum bayar' ||
    status === 'belum dibayar' ||
    status === 'unpaid' ||
    status === 'belum'
  ) {
    return 'belum'
  }

  return ''
}


// =========================================
// GET IURAN STATUS
// =========================================
//
// Prioritas:
// 1. Status langsung pada member
// 2. Status iuran pada member
// 3. Data iuran berdasarkan memberId/id
// =========================================

function getMemberPaymentStatus(
  member,
  iuranData
) {
  const directStatus = getValue(
    member,
    [
      'statusIuran',
      'iuranStatus',
      'statusPembayaran',
      'statusBayar',
      'status',
    ],
    ''
  )

  const normalizedDirect =
    normalizePaymentStatus(
      directStatus
    )

  if (normalizedDirect) {
    return normalizedDirect
  }

  const memberId =
    getValue(
      member,
      ['id', '_id', 'memberId'],
      ''
    )

  if (!memberId) {
    return ''
  }

  const relatedIuran =
    iuranData.find((item) => {
      const itemMemberId =
        getValue(
          item,
          [
            'memberId',
            'anggotaId',
            'idMember',
            'idAnggota',
            'member_id',
            'anggota_id',
          ],
          ''
        )

      return (
        String(itemMemberId) ===
        String(memberId)
      )
    })

  if (!relatedIuran) {
    return ''
  }

  const iuranStatus =
    getValue(
      relatedIuran,
      [
        'status',
        'statusIuran',
        'statusPembayaran',
        'statusBayar',
      ],
      ''
    )

  return normalizePaymentStatus(
    iuranStatus
  )
}


// =========================================
// DISPLAY IURAN
// =========================================

function getPaymentDisplay(
  member,
  iuranData
) {
  const status =
    getMemberPaymentStatus(
      member,
      iuranData
    )

  if (status === 'lunas') {
    return {
      label: 'Lunas',
      status: 'success',
    }
  }

  if (status === 'menunggu') {
    return {
      label: 'Menunggu',
      status: 'info',
    }
  }

  if (status === 'belum') {
    return {
      label: 'Belum Lunas',
      status: 'warning',
    }
  }

  return {
    label: 'Belum Ada Data',
    status: 'warning',
  }
}


// =========================================
// ACTIVITY TITLE
// =========================================

function getActivityTitle(item) {
  return getValue(
    item,
    [
      'judul',
      'title',
      'namaKegiatan',
      'nama',
      'kegiatan',
      'name',
    ],
    'Kegiatan Punguan'
  )
}


// =========================================
// ACTIVITY DESCRIPTION
// =========================================

function getActivityDescription(item) {
  const wilayah =
    getValue(
      item,
      [
        'wilayah',
        'namaWilayah',
        'region',
        'daerah',
      ],
      ''
    )

  const tanggal =
    getValue(
      item,
      [
        'tanggal',
        'date',
        'tanggalKegiatan',
        'createdAt',
      ],
      ''
    )

  const description =
    getValue(
      item,
      [
        'deskripsi',
        'description',
        'keterangan',
        'catatan',
      ],
      ''
    )

  const parts = []

  if (wilayah) {
    parts.push(wilayah)
  }

  if (description) {
    parts.push(description)
  }

  if (tanggal) {
    parts.push(formatDate(tanggal))
  }

  if (parts.length === 0) {
    return 'Informasi kegiatan terbaru'
  }

  return parts.join(' • ')
}


// =========================================
// ACTIVITY COLOR
// =========================================

function getActivityColor(index) {
  const colors = [
    'green',
    'blue',
    'orange',
  ]

  return colors[
    index % colors.length
  ]
}


// =========================================
// DASHBOARD
// =========================================

function Dashboard() {

  // =========================================
  // SEARCH
  // =========================================

  const [search, setSearch] =
    useState('')


  // =========================================
  // DATA STORAGE
  // =========================================

  const [members, setMembers] =
  useState(() => getMembers())

const [kegiatan, setKegiatan] =
  useState(() => getKegiatan())

const [koordinator, setKoordinator] =
  useState(() => getKoordinator())

const [iuran, setIuran] =
  useState(() => getIuran())


  // =========================================
  // LOAD DATA
  // =========================================

  const loadDashboardData = () => {
    try {
      setMembers(
        Array.isArray(getMembers())
          ? getMembers()
          : []
      )

      setKegiatan(
        Array.isArray(getKegiatan())
          ? getKegiatan()
          : []
      )

      setKoordinator(
        Array.isArray(getKoordinator())
          ? getKoordinator()
          : []
      )

      setIuran(
        Array.isArray(getIuran())
          ? getIuran()
          : []
      )
    } catch (error) {
      console.error(
        'Gagal memuat data dashboard:',
        error
      )

      setMembers([])
      setKegiatan([])
      setKoordinator([])
      setIuran([])
    }
  }

  // =========================================
  // STORAGE EVENT
  // =========================================
  //
  // Jika data berubah melalui halaman/tab lain,
  // dashboard akan membaca data terbaru.
  // =========================================

  useEffect(() => {
    const unsubscribe =
      subscribeStorage(() => {
        loadDashboardData()
      })

    return unsubscribe
  }, [])


  // =========================================
  // DATA ANGGOTA TERBARU
  // =========================================

  const latestMembers =
    useMemo(() => {
      return [...members]
        .sort(
          (a, b) =>
            getTimeValue(b) -
            getTimeValue(a)
        )
        .slice(0, 8)
        .map((member) => {
          const name =
            getMemberName(member)

          const payment =
            getPaymentDisplay(
              member,
              iuran
            )

          return {
            id:
              getValue(
                member,
                ['id', '_id'],
                name
              ),

            initials:
              getInitials(name),

            name,

            wilayah:
              getMemberRegion(member),

            iuran:
              payment.label,

            status:
              payment.status,

            date:
              formatDate(
                getValue(
                  member,
                  [
                    'tanggalGabung',
                    'tanggal',
                    'date',
                    'createdAt',
                  ],
                  ''
                )
              ),
          }
        })
    }, [
      members,
      iuran,
    ])


  // =========================================
  // SEARCH MEMBER
  // =========================================

  const filteredMembers =
    useMemo(() => {
      const keyword =
        normalizeText(search)

      if (!keyword) {
        return latestMembers
      }

      return latestMembers.filter(
        (member) => {
          return (
            normalizeText(
              member.name
            ).includes(keyword) ||

            normalizeText(
              member.wilayah
            ).includes(keyword)
          )
        }
      )
    }, [
      latestMembers,
      search,
    ])


  // =========================================
  // TOTAL MEMBER
  // =========================================

  const totalMembers =
    members.length


  // =========================================
  // TOTAL KOORDINATOR
  // =========================================

  const totalKoordinator =
    koordinator.length


  // =========================================
  // STATUS IURAN
  // =========================================

  const paymentSummary =
    useMemo(() => {

      let lunas = 0
      let belum = 0
      let menunggu = 0

      members.forEach(
        (member) => {
          const status =
            getMemberPaymentStatus(
              member,
              iuran
            )

          if (status === 'lunas') {
            lunas += 1
          } else if (
            status === 'menunggu'
          ) {
            menunggu += 1
          } else if (
            status === 'belum'
          ) {
            belum += 1
          }
        }
      )


      // Jika tidak ada status iuran
      // pada member, gunakan data iuran
      // sebagai fallback.
      if (
        lunas === 0 &&
        belum === 0 &&
        menunggu === 0 &&
        iuran.length > 0
      ) {
        iuran.forEach(
          (item) => {
            const status =
              normalizePaymentStatus(
                getValue(
                  item,
                  [
                    'status',
                    'statusIuran',
                    'statusPembayaran',
                    'statusBayar',
                  ],
                  ''
                )
              )

            if (status === 'lunas') {
              lunas += 1
            } else if (
              status === 'menunggu'
            ) {
              menunggu += 1
            } else if (
              status === 'belum'
            ) {
              belum += 1
            }
          }
        )
      }

      return {
        lunas,
        belum,
        menunggu,
      }

    }, [
      members,
      iuran,
    ])


  // =========================================
  // PERCENTAGE IURAN
  // =========================================

  const paymentPercentage =
    totalMembers > 0
      ? (
          paymentSummary.lunas /
          totalMembers
        ) * 100
      : 0


  // =========================================
  // ACTIVITIES
  // =========================================

  const activities =
    useMemo(() => {
      return [...kegiatan]
        .sort(
          (a, b) =>
            getTimeValue(b) -
            getTimeValue(a)
        )
        .slice(0, 5)
        .map(
          (
            activity,
            index
          ) => ({
            id:
              getValue(
                activity,
                ['id', '_id'],
                `${index}`
              ),

            title:
              getActivityTitle(
                activity
              ),

            description:
              getActivityDescription(
                activity
              ),

            color:
              getActivityColor(
                index
              ),
          })
        )
    }, [
      kegiatan,
    ])


  // =========================================
  // REGIONS
  // =========================================

  const regions =
    useMemo(() => {

      const regionMap =
        new Map()

      members.forEach(
        (member) => {
          const region =
            getMemberRegion(
              member
            )

          if (!regionMap.has(region)) {
            regionMap.set(
              region,
              0
            )
          }

          regionMap.set(
            region,
            regionMap.get(region) + 1
          )
        }
      )


      const regionData =
        Array.from(
          regionMap.entries()
        )
          .map(
            ([name, value]) => ({
              name,
              value,
            })
          )
          .sort(
            (a, b) =>
              b.value - a.value
          )
          .slice(0, 6)


      const maxValue =
        regionData.length > 0
          ? Math.max(
              ...regionData.map(
                (item) =>
                  item.value
              )
            )
          : 1


      return regionData.map(
        (region) => ({
          ...region,

          width:
            `${Math.max(
              4,
              (region.value /
                maxValue) *
                100
            )}%`,
        })
      )

    }, [
      members,
    ])


  // =========================================
  // EXPORT DATA
  // =========================================

  const handleExportData = () => {
    try {
      const data = {
        members,
        kegiatan,
        koordinator,
        iuran,
        exportedAt:
          new Date().toISOString(),
      }

      const blob =
        new Blob(
          [
            JSON.stringify(
              data,
              null,
              2
            ),
          ],
          {
            type:
              'application/json',
          }
        )

      const url =
        URL.createObjectURL(
          blob
        )

      const anchor =
        document.createElement(
          'a'
        )

      anchor.href = url
      anchor.download =
        'punguan-gultom-dashboard-data.json'

      document.body.appendChild(
        anchor
      )

      anchor.click()

      document.body.removeChild(
        anchor
      )

      URL.revokeObjectURL(
        url
      )
    } catch (error) {
      console.error(
        'Gagal export data:',
        error
      )
    }
  }


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

          <button
            className="btn btn-secondary"
            type="button"
            onClick={
              handleExportData
            }
          >
            ↓ &nbsp; Export Data
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
            {totalMembers}
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
            {totalKoordinator}
          </div>

          <div className="stat-change success-text">
            Wilayah yang terdaftar
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
            {paymentSummary.lunas}
          </div>

          <div className="stat-change success-text">
            {paymentPercentage.toFixed(
              1
            )}% dari total anggota
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
            {paymentSummary.belum}
          </div>

          <div className="stat-change warning-text">
            {paymentSummary.menunggu > 0
              ? `${paymentSummary.menunggu} menunggu pembayaran`
              : 'Perlu ditindaklanjuti'}
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
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
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

                    <tr
                      key={member.id}
                    >

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
                          className={
                            `badge badge-${member.status}`
                          }
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
                {search
                  ? 'Anggota tidak ditemukan.'
                  : 'Belum ada data anggota.'}
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

            {activities.length > 0 ? (

              activities.map(
                (activity) => (

                  <div
                    className="activity-item"
                    key={activity.id}
                  >

                    <span
                      className={
                        `activity-dot ${activity.color}`
                      }
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
              )

            ) : (

              <div className="empty-search">
                Belum ada kegiatan.
              </div>

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

          {regions.length > 0 ? (

            regions.map(
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
                          width:
                            region.width,
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
            )

          ) : (

            <div className="empty-search">
              Belum ada data wilayah anggota.
            </div>

          )}

        </div>

      </section>

    </>
  )
}


export default Dashboard