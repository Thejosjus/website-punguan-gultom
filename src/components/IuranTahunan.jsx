import { useEffect, useMemo, useState } from 'react'

/* =========================================================
   KONFIGURASI
========================================================= */

const MEMBER_STORAGE_KEYS = [
  'punguan_anggota',
  'anggota',
  'members',
  'punguanGultom_anggota',
]

const IURAN_STORAGE_KEY = 'punguan_iuran_tahunan'

const CURRENT_YEAR = new Date().getFullYear()

const YEAR_OPTIONS = Array.from(
  { length: 11 },
  (_, index) => CURRENT_YEAR - 5 + index
)

const PAYMENT_STATUS = {
  PAID: 'Lunas',
  UNPAID: 'Belum Lunas',
}

const PAYMENT_METHOD = {
  CASH: 'Tunai',
  TRANSFER: 'Transfer',
  NA: 'N/A',
}

/* =========================================================
   LOCAL STORAGE HELPER
========================================================= */

function readLocalStorage(key, fallback = []) {
  try {
    const rawData = localStorage.getItem(key)

    if (!rawData) {
      return fallback
    }

    const parsedData = JSON.parse(rawData)

    return parsedData ?? fallback
  } catch (error) {
    console.error(
      `Gagal membaca localStorage: ${key}`,
      error
    )

    return fallback
  }
}

function getStoredMembers() {
  for (const key of MEMBER_STORAGE_KEYS) {
    const data = readLocalStorage(key, null)

    if (Array.isArray(data)) {
      return data
    }
  }

  return []
}

function getStoredIuran() {
  const data = readLocalStorage(
    IURAN_STORAGE_KEY,
    []
  )

  return Array.isArray(data) ? data : []
}

/* =========================================================
   MEMBER HELPER
========================================================= */

function getMemberId(member, index = 0) {
  return (
    member?.id ??
    member?._id ??
    member?.memberId ??
    member?.kode ??
    member?.nomor ??
    `member-${index}`
  )
}

function getMemberName(member) {
  return (
    member?.namaSuami ??
    member?.nama ??
    member?.name ??
    member?.namaAnggota ??
    member?.namaKepalaKeluarga ??
    '-'
  )
}

function getMemberWife(member) {
  return (
    member?.namaIstri ??
    member?.istri ??
    member?.wife ??
    '-'
  )
}

function getMemberWilayah(member) {
  return (
    member?.wilayah ??
    member?.region ??
    member?.daerah ??
    '-'
  )
}

function getMemberStatus(member) {
  return (
    member?.status ??
    member?.statusKekerabatan ??
    member?.hubungan ??
    '-'
  )
}

function getMemberPhone(member) {
  return (
    member?.noHp ??
    member?.noHP ??
    member?.phone ??
    member?.telepon ??
    '-'
  )
}

/* =========================================================
   FORMATTER
========================================================= */

function formatRupiah(value) {
  const number = Number(value) || 0

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number)
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '-'
  }

  try {
    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return dateValue
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateValue
  }
}

function getTodayISO() {
  return new Date()
    .toISOString()
    .slice(0, 10)
}

/* =========================================================
   FORM HELPER
========================================================= */

function createEmptyForm() {
  return {
    nominal: '',
    statusPembayaran: PAYMENT_STATUS.UNPAID,
    tanggalPembayaran: '',
    metodePembayaran: PAYMENT_METHOD.NA,
    catatan: '',
  }
}

function createFormFromIuran(iuran) {
  if (!iuran) {
    return createEmptyForm()
  }

  return {
    nominal: iuran.nominal ?? '',
    statusPembayaran:
      iuran.statusPembayaran ??
      PAYMENT_STATUS.UNPAID,
    tanggalPembayaran:
      iuran.tanggalPembayaran ?? '',
    metodePembayaran:
      iuran.metodePembayaran ??
      PAYMENT_METHOD.NA,
    catatan: iuran.catatan ?? '',
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function IuranTahunan() {
  /* =======================================================
     STATE
  ======================================================= */

  const [members, setMembers] = useState([])

  const [iuranData, setIuranData] = useState(() =>
    getStoredIuran()
  )

  const [selectedYear, setSelectedYear] =
    useState(CURRENT_YEAR)

  const [search, setSearch] = useState('')

  const [wilayahFilter, setWilayahFilter] =
    useState('Semua Wilayah')

  const [statusFilter, setStatusFilter] =
    useState('Semua Status')

  const [showMemberModal, setShowMemberModal] =
    useState(false)

  const [showForm, setShowForm] =
    useState(false)

  const [memberSearch, setMemberSearch] =
    useState('')

  const [selectedMember, setSelectedMember] =
    useState(null)

  const [editingIuran, setEditingIuran] =
    useState(null)

  const [form, setForm] =
    useState(createEmptyForm())

  /* =======================================================
     LOAD MEMBERS
  ======================================================= */

  useEffect(() => {
    const loadMembers = () => {
      setMembers(getStoredMembers())
    }

    loadMembers()

    const handleStorageChange = () => {
      loadMembers()
    }

    window.addEventListener(
      'storage',
      handleStorageChange
    )

    return () => {
      window.removeEventListener(
        'storage',
        handleStorageChange
      )
    }
  }, [])

  /* =======================================================
     SAVE IURAN
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        IURAN_STORAGE_KEY,
        JSON.stringify(iuranData)
      )
    } catch (error) {
      console.error(
        'Gagal menyimpan data iuran:',
        error
      )
    }
  }, [iuranData])

  /* =======================================================
     WILAYAH OPTIONS
  ======================================================= */

  const wilayahOptions = useMemo(() => {
    const wilayahSet = new Set()

    members.forEach((member) => {
      const wilayah = getMemberWilayah(member)

      if (
        wilayah &&
        wilayah !== '-'
      ) {
        wilayahSet.add(wilayah)
      }
    })

    return [
      'Semua Wilayah',
      ...Array.from(wilayahSet).sort(
        (a, b) =>
          a.localeCompare(b, 'id')
      ),
    ]
  }, [members])

  /* =======================================================
     IURAN TAHUN TERPILIH
  ======================================================= */

  const currentYearIuran = useMemo(() => {
    return iuranData.filter(
      (item) =>
        Number(item.tahun) ===
        Number(selectedYear)
    )
  }, [
    iuranData,
    selectedYear,
  ])

  /* =======================================================
     TABLE DATA
  ======================================================= */

  const tableData = useMemo(() => {
    return members.map(
      (member, index) => {
        const memberId = getMemberId(
          member,
          index
        )

        const iuran =
          currentYearIuran.find(
            (item) =>
              String(item.memberId) ===
              String(memberId)
          ) ?? null

        return {
          member,
          memberId,
          iuran,
        }
      }
    )
  }, [
    members,
    currentYearIuran,
  ])

  /* =======================================================
     DATA UNTUK MODAL PILIH ANGGOTA
  ======================================================= */

  const availableMembers = useMemo(() => {
    const keyword = memberSearch
      .trim()
      .toLowerCase()

    return tableData.filter(
      ({ member, iuran }) => {
        if (iuran) {
          return false
        }

        if (!keyword) {
          return true
        }

        const nama = String(
          getMemberName(member)
        ).toLowerCase()

        const istri = String(
          getMemberWife(member)
        ).toLowerCase()

        const phone = String(
          getMemberPhone(member)
        ).toLowerCase()

        const wilayah = String(
          getMemberWilayah(member)
        ).toLowerCase()

        return (
          nama.includes(keyword) ||
          istri.includes(keyword) ||
          phone.includes(keyword) ||
          wilayah.includes(keyword)
        )
      }
    )
  }, [
    tableData,
    memberSearch,
  ])

  /* =======================================================
     FILTER DATA
  ======================================================= */

  const filteredData = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase()

    return tableData.filter(
      ({ member, iuran }) => {
        const nama = String(
          getMemberName(member)
        ).toLowerCase()

        const istri = String(
          getMemberWife(member)
        ).toLowerCase()

        const phone = String(
          getMemberPhone(member)
        ).toLowerCase()

        const wilayah =
          getMemberWilayah(member)

        const matchesSearch =
          !keyword ||
          nama.includes(keyword) ||
          istri.includes(keyword) ||
          phone.includes(keyword)

        const matchesWilayah =
          wilayahFilter ===
            'Semua Wilayah' ||
          wilayah === wilayahFilter

        const paymentStatus =
          iuran?.statusPembayaran ??
          PAYMENT_STATUS.UNPAID

        const matchesStatus =
          statusFilter ===
            'Semua Status' ||
          paymentStatus === statusFilter

        return (
          matchesSearch &&
          matchesWilayah &&
          matchesStatus
        )
      }
    )
  }, [
    tableData,
    search,
    wilayahFilter,
    statusFilter,
  ])

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    let lunas = 0
    let belumLunas = 0
    let totalPemasukan = 0

    currentYearIuran.forEach(
      (item) => {
        if (
          item.statusPembayaran ===
          PAYMENT_STATUS.PAID
        ) {
          lunas += 1

          totalPemasukan +=
            Number(item.nominal) || 0
        } else {
          belumLunas += 1
        }
      }
    )

    const totalAnggota =
      members.length

    const persentaseLunas =
      totalAnggota > 0
        ? (
            (lunas /
              totalAnggota) *
            100
          ).toFixed(1)
        : '0.0'

    return {
      totalAnggota,
      lunas,
      belumLunas,
      totalPemasukan,
      persentaseLunas,
    }
  }, [
    members,
    currentYearIuran,
  ])

  /* =======================================================
     OPEN TAMBAH IURAN
  ======================================================= */

  function handleOpenAdd() {
    setMemberSearch('')
    setSelectedMember(null)
    setEditingIuran(null)
    setForm(createEmptyForm())
    setShowForm(false)
    setShowMemberModal(true)
  }

  /* =======================================================
     CLOSE MEMBER MODAL
  ======================================================= */

  function handleCloseMemberModal() {
    setShowMemberModal(false)
    setMemberSearch('')
  }

  /* =======================================================
     PILIH ANGGOTA
  ======================================================= */

  function handleSelectMember(member) {
    setSelectedMember(member)
    setEditingIuran(null)
    setForm(createEmptyForm())

    setShowMemberModal(false)
    setMemberSearch('')
    setShowForm(true)
  }

  /* =======================================================
     EDIT IURAN
  ======================================================= */

  function handleEdit(
    member,
    iuran
  ) {
    setSelectedMember(member)
    setEditingIuran(iuran)

    setForm(
      createFormFromIuran(iuran)
    )

    setShowForm(true)
    setShowMemberModal(false)
  }

  /* =======================================================
     CLOSE FORM
  ======================================================= */

  function handleCloseForm() {
    setShowForm(false)
    setSelectedMember(null)
    setEditingIuran(null)
    setForm(createEmptyForm())
  }

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  function handleFormChange(event) {
    const {
      name,
      value,
    } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  /* =======================================================
     PAYMENT STATUS CHANGE
  ======================================================= */

  function handleStatusChange(event) {
    const status =
      event.target.value

    setForm((previous) => ({
      ...previous,

      statusPembayaran:
        status,

      tanggalPembayaran:
        status ===
        PAYMENT_STATUS.PAID
          ? previous.tanggalPembayaran ||
            getTodayISO()
          : '',

      metodePembayaran:
        status ===
        PAYMENT_STATUS.PAID
          ? previous.metodePembayaran ===
            PAYMENT_METHOD.NA
            ? PAYMENT_METHOD.CASH
            : previous.metodePembayaran
          : PAYMENT_METHOD.NA,
    }))
  }

  /* =======================================================
     SUBMIT IURAN
  ======================================================= */

  function handleSubmit(event) {
    event.preventDefault()

    if (!selectedMember) {
      return
    }

    const memberIndex =
      members.indexOf(
        selectedMember
      )

    const memberId =
      getMemberId(
        selectedMember,
        memberIndex
      )

    const cleanNominal =
      Number(
        String(form.nominal)
          .replace(/[^\d]/g, '')
      ) || 0

    const existingRecord =
      currentYearIuran.find(
        (item) =>
          String(item.memberId) ===
          String(memberId)
      )

    const recordId =
      editingIuran?.id ??
      existingRecord?.id ??
      `${selectedYear}-${memberId}`

    const isPaid =
      form.statusPembayaran ===
      PAYMENT_STATUS.PAID

    const newRecord = {
      id: recordId,

      tahun:
        Number(selectedYear),

      memberId,

      namaSuami:
        getMemberName(
          selectedMember
        ),

      namaIstri:
        getMemberWife(
          selectedMember
        ),

      wilayah:
        getMemberWilayah(
          selectedMember
        ),

      statusKekerabatan:
        getMemberStatus(
          selectedMember
        ),

      nominal:
        cleanNominal,

      statusPembayaran:
        form.statusPembayaran,

      tanggalPembayaran:
        isPaid
          ? form.tanggalPembayaran ||
            getTodayISO()
          : '',

      metodePembayaran:
        isPaid
          ? form.metodePembayaran ||
            PAYMENT_METHOD.CASH
          : PAYMENT_METHOD.NA,

      catatan:
        String(
          form.catatan || ''
        ).trim(),

      updatedAt:
        new Date().toISOString(),
    }

    setIuranData(
      (previous) => {
        const existingIndex =
          previous.findIndex(
            (item) =>
              String(item.id) ===
              String(recordId)
          )

        if (
          existingIndex !== -1
        ) {
          const updated = [
            ...previous,
          ]

          updated[
            existingIndex
          ] = newRecord

          return updated
        }

        return [
          ...previous,
          newRecord,
        ]
      }
    )

    handleCloseForm()
  }

  /* =======================================================
     DELETE
  ======================================================= */

  function handleDelete(
    member,
    iuran
  ) {
    if (!iuran) {
      return
    }

    const nama =
      getMemberName(member)

    const confirmed =
      window.confirm(
        `Hapus data iuran ${nama} untuk tahun ${selectedYear}?`
      )

    if (!confirmed) {
      return
    }

    setIuranData(
      (previous) =>
        previous.filter(
          (item) =>
            String(item.id) !==
            String(iuran.id)
        )
    )
  }

  /* =======================================================
     RESET FILTER
  ======================================================= */

  function resetFilters() {
    setSearch('')
    setWilayahFilter(
      'Semua Wilayah'
    )
    setStatusFilter(
      'Semua Status'
    )
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="iuran-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="content-header">

        <div>
          <h1>
            Iuran Tahunan
          </h1>

          <p>
            Kelola pembayaran iuran
            anggota Punguan Gultom
            berdasarkan tahun.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary iuran-add-button"
          onClick={handleOpenAdd}
        >
          + Tambah Iuran
        </button>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="iuran-toolbar">

        <div className="toolbar-group">
          <label>
            Tahun Iuran
          </label>

          <select
            value={selectedYear}
            onChange={(event) =>
              setSelectedYear(
                Number(
                  event.target.value
                )
              )
            }
          >
            {YEAR_OPTIONS.map(
              (year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              )
            )}
          </select>
        </div>

        <div className="toolbar-group search-group">
          <label>
            Cari Anggota
          </label>

          <input
            type="text"
            placeholder="Cari nama, istri, atau no. HP..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <div className="toolbar-group">
          <label>
            Wilayah
          </label>

          <select
            value={wilayahFilter}
            onChange={(event) =>
              setWilayahFilter(
                event.target.value
              )
            }
          >
            {wilayahOptions.map(
              (wilayah) => (
                <option
                  key={wilayah}
                  value={wilayah}
                >
                  {wilayah}
                </option>
              )
            )}
          </select>
        </div>

        <div className="toolbar-group">
          <label>
            Status
          </label>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="Semua Status">
              Semua Status
            </option>

            <option value="Lunas">
              Lunas
            </option>

            <option value="Belum Lunas">
              Belum Lunas
            </option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-secondary iuran-reset-button"
          onClick={resetFilters}
        >
          Reset
        </button>

      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="iuran-stat-grid">

        <div className="iuran-stat-card">

          <div className="iuran-stat-label">
            Total Anggota
          </div>

          <div className="iuran-stat-value">
            {statistics.totalAnggota}
          </div>

          <div className="iuran-stat-description">
            Anggota terdaftar
          </div>

        </div>

        <div className="iuran-stat-card iuran-stat-success">

          <div className="iuran-stat-label">
            Lunas
          </div>

          <div className="iuran-stat-value">
            {statistics.lunas}
          </div>

          <div className="iuran-stat-description">
            {statistics.persentaseLunas}%
            {' '}
            dari anggota
          </div>

        </div>

        <div className="iuran-stat-card iuran-stat-warning">

          <div className="iuran-stat-label">
            Belum Lunas
          </div>

          <div className="iuran-stat-value">
            {statistics.belumLunas}
          </div>

          <div className="iuran-stat-description">
            Perlu ditindaklanjuti
          </div>

        </div>

        <div className="iuran-stat-card iuran-stat-income">

          <div className="iuran-stat-label">
            Total Pemasukan
          </div>

          <div className="iuran-stat-value iuran-income-value">
            {formatRupiah(
              statistics.totalPemasukan
            )}
          </div>

          <div className="iuran-stat-description">
            Iuran {selectedYear}
          </div>

        </div>

      </section>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="card iuran-table-card">

        <div className="card-header">

          <div>
            <h3 className="card-title">
              Daftar Iuran {selectedYear}
            </h3>

            <div className="card-subtitle">
              {filteredData.length} anggota
              {' '}
              ditampilkan
            </div>
          </div>

        </div>

        <div className="table-wrapper">

          <table className="data-table iuran-table">

            <thead>
              <tr>
                <th>ANGGOTA</th>
                <th>WILAYAH</th>
                <th>STATUS</th>
                <th>NOMINAL</th>
                <th>PEMBAYARAN</th>
                <th>TANGGAL</th>
                <th>METODE</th>
                <th>CATATAN</th>
                <th>AKSI</th>
              </tr>
            </thead>

            <tbody>

              {filteredData.map(
                ({
                  member,
                  memberId,
                  iuran,
                }) => {
                  const nama =
                    getMemberName(
                      member
                    )

                  const istri =
                    getMemberWife(
                      member
                    )

                  const wilayah =
                    getMemberWilayah(
                      member
                    )

                  const status =
                    getMemberStatus(
                      member
                    )

                  const initials =
                    String(nama)
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(
                        (word) =>
                          word.charAt(0)
                      )
                      .join('')
                      .toUpperCase()

                  const paymentStatus =
                    iuran?.statusPembayaran ??
                    PAYMENT_STATUS.UNPAID

                  return (
                    <tr
                      key={String(
                        memberId
                      )}
                    >

                      {/* ANGGOTA */}

                      <td>
                        <div className="member-cell">

                          <div className="member-avatar">
                            {initials || '?'}
                          </div>

                          <div>

                            <div className="member-name">
                              {nama}
                            </div>

                            {istri !== '-' && (
                              <div className="iuran-member-wife">
                                Istri:{' '}
                                {istri}
                              </div>
                            )}

                          </div>

                        </div>
                      </td>

                      {/* WILAYAH */}

                      <td>
                        {wilayah}
                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`badge ${
                            paymentStatus ===
                            PAYMENT_STATUS.PAID
                              ? 'badge-success'
                              : 'badge-warning'
                          }`}
                        >
                          {paymentStatus}
                        </span>

                        <div className="iuran-relationship">
                          {status}
                        </div>

                      </td>

                      {/* NOMINAL */}

                      <td>
                        {iuran ? (
                          formatRupiah(
                            iuran.nominal
                          )
                        ) : (
                          <span className="empty-value">
                            Belum diinput
                          </span>
                        )}
                      </td>

                      {/* PEMBAYARAN */}

                      <td>
                        {iuran ? (
                          paymentStatus
                        ) : (
                          <span className="empty-value">
                            Belum diinput
                          </span>
                        )}
                      </td>

                      {/* TANGGAL */}

                      <td>
                        {iuran
                          ? formatDate(
                              iuran.tanggalPembayaran
                            )
                          : '-'}
                      </td>

                      {/* METODE */}

                      <td>
                        {iuran
                          ? iuran.metodePembayaran
                          : '-'}
                      </td>

                      {/* CATATAN */}

                      <td>
                        {iuran?.catatan ? (
                          iuran.catatan
                        ) : (
                          <span className="empty-value">
                            -
                          </span>
                        )}
                      </td>

                      {/* AKSI */}

                      <td>

                        <div className="iuran-actions">

                          {!iuran && (
                            <button
                              type="button"
                              className="btn btn-primary btn-small"
                              onClick={() =>
                                handleSelectMember(
                                  member
                                )
                              }
                            >
                              Input
                            </button>
                          )}

                          {iuran && (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                onClick={() =>
                                  handleEdit(
                                    member,
                                    iuran
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="btn btn-danger btn-small"
                                onClick={() =>
                                  handleDelete(
                                    member,
                                    iuran
                                  )
                                }
                              >
                                Hapus
                              </button>
                            </>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                }
              )}

            </tbody>

          </table>

          {filteredData.length === 0 && (
            <div className="empty-search iuran-empty">

              {members.length === 0
                ? 'Belum ada data anggota. Silakan tambahkan anggota terlebih dahulu.'
                : 'Data anggota tidak ditemukan sesuai filter.'}

            </div>
          )}

        </div>

      </div>

      {/* =================================================
          MODAL TAMBAH IURAN - PILIH ANGGOTA
      ================================================= */}

      {showMemberModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseMemberModal()
            }
          }}
        >

          <div className="modal-card iuran-member-select-modal">

            <div className="modal-header">

              <div>
                <h2>
                  Tambah Iuran
                </h2>

                <p>
                  Pilih anggota untuk tahun {selectedYear}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  handleCloseMemberModal
                }
              >
                ×
              </button>

            </div>

            {/* SEARCH ANGGOTA */}

            <div className="member-search-wrapper">

              <input
                type="text"
                className="member-search-input"
                placeholder="Cari nama anggota, istri, wilayah, atau no. HP..."
                value={memberSearch}
                onChange={(event) =>
                  setMemberSearch(
                    event.target.value
                  )
                }
                autoFocus
              />

            </div>

            {/* DAFTAR ANGGOTA */}

            <div className="member-selection-list">

              {availableMembers.length > 0 ? (
                availableMembers.map(
                  ({
                    member,
                    memberId,
                  }) => {
                    const nama =
                      getMemberName(
                        member
                      )

                    const istri =
                      getMemberWife(
                        member
                      )

                    const wilayah =
                      getMemberWilayah(
                        member
                      )

                    const initials =
                      String(nama)
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(
                          (word) =>
                            word.charAt(0)
                        )
                        .join('')
                        .toUpperCase()

                    return (
                      <div
                        className="member-selection-item"
                        key={String(
                          memberId
                        )}
                      >

                        <div className="member-selection-info">

                          <div className="member-avatar">
                            {initials || '?'}
                          </div>

                          <div className="member-selection-text">

                            <div className="member-selection-name">
                              {nama}
                            </div>

                            <div className="member-selection-detail">
                              Wilayah:{' '}
                              {wilayah}
                            </div>

                            {istri !== '-' && (
                              <div className="member-selection-detail">
                                Istri:{' '}
                                {istri}
                              </div>
                            )}

                          </div>

                        </div>

                        <button
                          type="button"
                          className="btn btn-primary btn-small member-select-button"
                          onClick={() =>
                            handleSelectMember(
                              member
                            )
                          }
                        >
                          Pilih
                        </button>

                      </div>
                    )
                  }
                )
              ) : (
                <div className="member-selection-empty">

                  <div className="member-selection-empty-icon">
                    👤
                  </div>

                  {members.length === 0 ? (
                    <>
                      <strong>
                        Belum ada anggota
                      </strong>

                      <span>
                        Silakan tambahkan anggota terlebih dahulu pada menu Anggota.
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>
                        Anggota tidak ditemukan
                      </strong>

                      <span>
                        Tidak ada anggota yang tersedia untuk iuran tahun {selectedYear}.
                      </span>
                    </>
                  )}

                </div>
              )}

            </div>

            {/* FOOTER MODAL PILIH ANGGOTA */}

            <div className="member-selection-footer">

              <span>
                {availableMembers.length} anggota tersedia
              </span>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  handleCloseMemberModal
                }
              >
                Batal
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          MODAL FORM IURAN
      ================================================= */}

      {showForm &&
        selectedMember && (
          <div
            className="modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                handleCloseForm()
              }
            }}
          >

            <div className="modal-card iuran-modal">

              <div className="modal-header">

                <div>
                  <h2>
                    {editingIuran
                      ? 'Edit Iuran'
                      : 'Input Iuran'}
                  </h2>

                  <p>
                    Tahun {selectedYear}
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={
                    handleCloseForm
                  }
                >
                  ×
                </button>

              </div>

              {/* MEMBER INFO */}

              <div className="iuran-member-info">

                <div className="member-avatar large">

                  {getMemberName(
                    selectedMember
                  )
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(
                      (word) =>
                        word.charAt(0)
                    )
                    .join('')
                    .toUpperCase()}

                </div>

                <div>

                  <div className="iuran-form-member-name">
                    {getMemberName(
                      selectedMember
                    )}
                  </div>

                  <div className="iuran-form-member-detail">
                    Wilayah:{' '}
                    {getMemberWilayah(
                      selectedMember
                    )}
                  </div>

                  <div className="iuran-form-member-detail">
                    Status:{' '}
                    {getMemberStatus(
                      selectedMember
                    )}
                  </div>

                </div>

              </div>

              <form
                onSubmit={
                  handleSubmit
                }
              >

                {/* NOMINAL */}

                <div className="form-group">

                  <label>
                    Nominal Iuran
                    <span className="required">
                      *
                    </span>
                  </label>

                  <div className="input-prefix-wrapper">

                    <span>
                      Rp
                    </span>

                    <input
                      type="number"
                      name="nominal"
                      min="0"
                      step="1000"
                      placeholder="Contoh: 100000"
                      value={
                        form.nominal
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    />

                  </div>

                </div>

                {/* STATUS */}

                <div className="form-group">

                  <label>
                    Status Pembayaran
                    <span className="required">
                      *
                    </span>
                  </label>

                  <select
                    name="statusPembayaran"
                    value={
                      form.statusPembayaran
                    }
                    onChange={
                      handleStatusChange
                    }
                    required
                  >
                    <option value="Belum Lunas">
                      Belum Lunas
                    </option>

                    <option value="Lunas">
                      Lunas
                    </option>
                  </select>

                </div>

                {/* TANGGAL */}

                <div className="form-group">

                  <label>
                    Tanggal Pembayaran
                  </label>

                  <input
                    type="date"
                    name="tanggalPembayaran"
                    value={
                      form.tanggalPembayaran
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      form.statusPembayaran !==
                      PAYMENT_STATUS.PAID
                    }
                  />

                </div>

                {/* METODE */}

                <div className="form-group">

                  <label>
                    Metode Pembayaran
                  </label>

                  <select
                    name="metodePembayaran"
                    value={
                      form.metodePembayaran
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      form.statusPembayaran !==
                      PAYMENT_STATUS.PAID
                    }
                  >
                    <option value="N/A">
                      N/A
                    </option>

                    <option value="Tunai">
                      Tunai
                    </option>

                    <option value="Transfer">
                      Transfer
                    </option>
                  </select>

                </div>

                {/* CATATAN */}

                <div className="form-group">

                  <label>
                    Catatan
                  </label>

                  <textarea
                    name="catatan"
                    rows="3"
                    placeholder="Tambahkan catatan jika diperlukan..."
                    value={
                      form.catatan
                    }
                    onChange={
                      handleFormChange
                    }
                  />

                </div>

                {/* ACTION */}

                <div className="modal-actions">

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={
                      handleCloseForm
                    }
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingIuran
                      ? 'Simpan Perubahan'
                      : 'Simpan Iuran'}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      {/* =================================================
          LOCAL STYLE
      ================================================= */}

      <style>{`

        .iuran-page {
          width: 100%;
        }

        .content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .iuran-add-button {
          flex-shrink: 0;
          white-space: nowrap;
        }

        .iuran-toolbar {
          background: #ffffff;
          border: 1px solid #e3e8ef;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 18px;
          box-shadow: 0 2px 7px rgba(16, 24, 40, 0.025);
        }

        .toolbar-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 145px;
        }

        .toolbar-group label {
          color: #667085;
          font-size: 9px;
          font-weight: 700;
        }

        .toolbar-group input,
        .toolbar-group select {
          height: 35px;
          border: 1px solid #dce2eb;
          border-radius: 8px;
          background: #ffffff;
          color: #344054;
          padding: 0 10px;
          font-size: 10px;
          outline: none;
          box-sizing: border-box;
        }

        .toolbar-group input {
          width: 240px;
        }

        .toolbar-group input:focus,
        .toolbar-group select:focus {
          border-color: #84adff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .search-group {
          flex: 1;
        }

        .iuran-reset-button {
          height: 35px;
        }

        .iuran-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .iuran-stat-card {
          background: #ffffff;
          border: 1px solid #e3e8ef;
          border-radius: 12px;
          padding: 17px;
          min-height: 110px;
          box-shadow: 0 2px 7px rgba(16, 24, 40, 0.025);
        }

        .iuran-stat-label {
          color: #65758b;
          font-size: 10px;
          font-weight: 600;
        }

        .iuran-stat-value {
          margin-top: 9px;
          color: #173a5f;
          font-size: 24px;
          line-height: 1.1;
          font-weight: 800;
        }

        .iuran-stat-description {
          margin-top: 7px;
          color: #8a93a5;
          font-size: 9px;
        }

        .iuran-stat-success {
          border-top: 3px solid #10a67a;
        }

        .iuran-stat-success .iuran-stat-value {
          color: #027a48;
        }

        .iuran-stat-warning {
          border-top: 3px solid #f79009;
        }

        .iuran-stat-warning .iuran-stat-value {
          color: #b54708;
        }

        .iuran-stat-income {
          border-top: 3px solid #2563eb;
        }

        .iuran-stat-income .iuran-stat-value {
          color: #2563eb;
        }

        .iuran-income-value {
          font-size: 19px;
        }

        .iuran-table-card {
          margin-bottom: 20px;
        }

        .iuran-table th,
        .iuran-table td {
          vertical-align: middle;
        }

        .iuran-table td {
          white-space: nowrap;
        }

        .iuran-member-wife {
          margin-top: 3px;
          color: #98a2b3;
          font-size: 8px;
        }

        .iuran-relationship {
          margin-top: 5px;
          color: #98a2b3;
          font-size: 8px;
        }

        .empty-value {
          color: #98a2b3;
          font-size: 9px;
        }

        .iuran-actions {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .btn-small {
          min-width: 45px;
          padding: 6px 8px;
          font-size: 8px;
          border-radius: 6px;
        }

        .btn-danger {
          color: #b42318;
          background: #fff0ef;
          border: 1px solid #ffd3cf;
        }

        .btn-danger:hover {
          background: #ffe4e1;
        }

        .iuran-empty {
          padding: 35px 20px;
        }

        /* =================================================
           MODAL
        ================================================= */

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(2px);
        }

        .modal-card {
          width: 100%;
          max-width: 520px;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.22);
        }

        /* =================================================
           MODAL PILIH ANGGOTA
        ================================================= */

        .iuran-member-select-modal {
          max-width: 650px;
        }

        .member-search-wrapper {
          padding: 15px 20px;
          border-bottom: 1px solid #edf0f4;
        }

        .member-search-input {
          width: 100%;
          height: 38px;
          border: 1px solid #dce2eb;
          border-radius: 8px;
          background: #ffffff;
          color: #344054;
          padding: 0 12px;
          font-size: 11px;
          outline: none;
          box-sizing: border-box;
        }

        .member-search-input:focus {
          border-color: #84adff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .member-selection-list {
          max-height: 390px;
          overflow-y: auto;
          padding: 8px 0;
        }

        .member-selection-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 11px 20px;
          border-bottom: 1px solid #f0f2f5;
          transition: background 0.15s ease;
        }

        .member-selection-item:hover {
          background: #f8fafc;
        }

        .member-selection-item:last-child {
          border-bottom: 0;
        }

        .member-selection-info {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .member-selection-text {
          min-width: 0;
        }

        .member-selection-name {
          color: #173a5f;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-selection-detail {
          margin-top: 3px;
          color: #8a93a5;
          font-size: 8px;
        }

        .member-select-button {
          flex-shrink: 0;
        }

        .member-selection-empty {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 7px;
          padding: 25px;
          color: #667085;
        }

        .member-selection-empty-icon {
          font-size: 28px;
          margin-bottom: 3px;
        }

        .member-selection-empty strong {
          color: #344054;
          font-size: 11px;
        }

        .member-selection-empty span {
          max-width: 360px;
          color: #98a2b3;
          font-size: 9px;
          line-height: 1.5;
        }

        .member-selection-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 20px;
          border-top: 1px solid #edf0f4;
          background: #fafbfc;
        }

        .member-selection-footer > span {
          color: #98a2b3;
          font-size: 9px;
        }

        /* =================================================
           MODAL HEADER
        ================================================= */

        .modal-header {
          padding: 18px 20px;
          border-bottom: 1px solid #edf0f4;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .modal-header h2 {
          margin: 0;
          color: #173a5f;
          font-size: 17px;
          font-weight: 800;
        }

        .modal-header p {
          margin: 4px 0 0;
          color: #98a2b3;
          font-size: 9px;
        }

        .modal-close {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 7px;
          background: #f4f6f8;
          color: #667085;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          flex-shrink: 0;
        }

        .modal-close:hover {
          background: #e9edf2;
        }

        /* =================================================
           MEMBER INFO
        ================================================= */

        .iuran-member-info {
          margin: 18px 20px;
          padding: 13px;
          background: #f7f9fc;
          border: 1px solid #e9edf2;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .member-avatar.large {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          font-size: 11px;
        }

        .iuran-form-member-name {
          color: #173a5f;
          font-size: 11px;
          font-weight: 800;
        }

        .iuran-form-member-detail {
          margin-top: 3px;
          color: #8a93a5;
          font-size: 8px;
        }

        /* =================================================
           FORM
        ================================================= */

        .iuran-modal form {
          padding: 0 20px 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #344054;
          font-size: 10px;
          font-weight: 700;
        }

        .required {
          margin-left: 3px;
          color: #f04438;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          border: 1px solid #dce2eb;
          border-radius: 8px;
          background: #ffffff;
          color: #344054;
          padding: 9px 10px;
          font-size: 10px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-group input,
        .form-group select {
          height: 37px;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 75px;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #84adff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .form-group input:disabled,
        .form-group select:disabled {
          background: #f3f4f6;
          color: #98a2b3;
          cursor: not-allowed;
        }

        .input-prefix-wrapper {
          position: relative;
        }

        .input-prefix-wrapper > span {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #667085;
          font-size: 10px;
          font-weight: 700;
          z-index: 1;
        }

        .input-prefix-wrapper input {
          padding-left: 34px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 6px;
        }

        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 1100px) {

          .iuran-stat-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }

          .iuran-toolbar {
            flex-wrap: wrap;
          }

        }

        @media (max-width: 768px) {

          .content-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .iuran-add-button {
            width: 100%;
          }

          .iuran-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .toolbar-group,
          .toolbar-group input {
            width: 100%;
          }

          .iuran-stat-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }

          .iuran-reset-button {
            width: 100%;
          }

          .member-selection-item {
            align-items: flex-start;
          }

        }

        @media (max-width: 560px) {

          .iuran-stat-grid {
            grid-template-columns: 1fr;
          }

          .modal-overlay {
            padding: 10px;
          }

          .modal-card {
            max-height: calc(100vh - 20px);
          }

          .member-selection-item {
            flex-direction: column;
            align-items: stretch;
          }

          .member-select-button {
            width: 100%;
          }

          .member-selection-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .member-selection-footer .btn {
            width: 100%;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .modal-actions .btn {
            width: 100%;
          }

        }

      `}</style>

    </div>
  )
}

export default IuranTahunan