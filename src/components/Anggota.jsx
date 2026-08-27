import { useMemo, useState } from 'react'
import {
  getMembers,
  saveMembers,
} from '../utils/storage'

const STATUS_OPTIONS = [
  'Hula-Hula',
  'Boru',
  'Bere-Ibebere',
]

const emptyForm = {
  namaSuami: '',
  namaIstri: '',
  jumlahAnak: '',
  alamat: '',
  noHp: '',
  wilayah: '',
  status: '',
}

function Anggota() {
  // =========================================================
  // STATE
  // =========================================================

  const [members, setMembers] = useState(() => {
    const data = getMembers()

    return Array.isArray(data) ? data : []
  })

  const [search, setSearch] = useState('')
  const [filterWilayah, setFilterWilayah] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    ...emptyForm,
  })

  const [selectedMember, setSelectedMember] = useState(null)

  // =========================================================
  // FILTER DATA
  // =========================================================

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const wilayahKeyword = filterWilayah
      .trim()
      .toLowerCase()

    return members.filter((member) => {
      const namaSuami = String(
        member.namaSuami || ''
      ).toLowerCase()

      const namaIstri = String(
        member.namaIstri || ''
      ).toLowerCase()

      const noHp = String(
        member.noHp || ''
      ).toLowerCase()

      const alamat = String(
        member.alamat || ''
      ).toLowerCase()

      const wilayah = String(
        member.wilayah || ''
      ).toLowerCase()

      const matchesSearch =
        keyword === '' ||
        namaSuami.includes(keyword) ||
        namaIstri.includes(keyword) ||
        noHp.includes(keyword) ||
        alamat.includes(keyword) ||
        wilayah.includes(keyword)

      const matchesWilayah =
        wilayahKeyword === '' ||
        wilayah.includes(wilayahKeyword)

      const matchesStatus =
        filterStatus === '' ||
        member.status === filterStatus

      return (
        matchesSearch &&
        matchesWilayah &&
        matchesStatus
      )
    })
  }, [
    members,
    search,
    filterWilayah,
    filterStatus,
  ])

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // =========================================================
  // TAMBAH ANGGOTA
  // =========================================================

  const handleAdd = () => {
    setEditingId(null)

    setForm({
      ...emptyForm,
    })

    setShowForm(true)
  }

  // =========================================================
  // EDIT ANGGOTA
  // =========================================================

  const handleEdit = (member) => {
    setEditingId(member.id)

    setForm({
      namaSuami: member.namaSuami || '',
      namaIstri: member.namaIstri || '',
      jumlahAnak:
        member.jumlahAnak !== undefined &&
        member.jumlahAnak !== null
          ? String(member.jumlahAnak)
          : '',
      alamat: member.alamat || '',
      noHp: member.noHp || '',
      wilayah: member.wilayah || '',
      status: member.status || '',
    })

    setShowForm(true)
  }

  // =========================================================
  // SIMPAN DATA
  // =========================================================

  const handleSubmit = (event) => {
    event.preventDefault()

    // Validasi nama suami
    if (!form.namaSuami.trim()) {
      alert('Nama Suami wajib diisi.')
      return
    }

    // Validasi nama istri
    if (!form.namaIstri.trim()) {
      alert('Nama Istri wajib diisi.')
      return
    }

    // Validasi wilayah
    if (!form.wilayah.trim()) {
      alert('Wilayah wajib diisi.')
      return
    }

    // Validasi status
    if (!form.status) {
      alert('Status kekerabatan wajib dipilih.')
      return
    }

    const jumlahAnak =
      form.jumlahAnak.trim() === ''
        ? 0
        : Number(form.jumlahAnak)

    // Validasi jumlah anak
    if (
      Number.isNaN(jumlahAnak) ||
      jumlahAnak < 0 ||
      !Number.isInteger(jumlahAnak)
    ) {
      alert(
        'Jumlah anak harus berupa angka bulat 0 atau lebih.'
      )
      return
    }

    // =======================================================
    // EDIT DATA
    // =======================================================

    if (editingId !== null) {
      const updatedMembers = members.map((member) => {
        if (member.id !== editingId) {
          return member
        }

        return {
          ...member,
          namaSuami: form.namaSuami.trim(),
          namaIstri: form.namaIstri.trim(),
          jumlahAnak,
          alamat: form.alamat.trim(),
          noHp: form.noHp.trim(),
          wilayah: form.wilayah.trim(),
          status: form.status,
        }
      })

      setMembers(updatedMembers)
      saveMembers(updatedMembers)

      setShowForm(false)
      setEditingId(null)

      setForm({
        ...emptyForm,
      })

      return
    }

    // =======================================================
    // TAMBAH DATA BARU
    // =======================================================

    const newMember = {
      id: Date.now(),
      namaSuami: form.namaSuami.trim(),
      namaIstri: form.namaIstri.trim(),
      jumlahAnak,
      alamat: form.alamat.trim(),
      noHp: form.noHp.trim(),
      wilayah: form.wilayah.trim(),
      status: form.status,
    }

    const updatedMembers = [
      ...members,
      newMember,
    ]

    setMembers(updatedMembers)
    saveMembers(updatedMembers)

    setShowForm(false)
    setEditingId(null)

    setForm({
      ...emptyForm,
    })
  }

  // =========================================================
  // HAPUS DATA
  // =========================================================

  const handleDelete = (member) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus data keluarga ${member.namaSuami}?`
    )

    if (!confirmed) {
      return
    }

    const updatedMembers = members.filter(
      (item) => item.id !== member.id
    )

    setMembers(updatedMembers)
    saveMembers(updatedMembers)

    if (
      selectedMember &&
      selectedMember.id === member.id
    ) {
      setSelectedMember(null)
    }
  }

  // =========================================================
  // RESET FILTER
  // =========================================================

  const handleResetFilter = () => {
    setSearch('')
    setFilterWilayah('')
    setFilterStatus('')
  }

  const hasActiveFilter =
    search !== '' ||
    filterWilayah !== '' ||
    filterStatus !== ''

  // =========================================================
  // STATISTIK
  // =========================================================

  const totalAnggota = members.length
  const totalDitampilkan = filteredMembers.length

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)

    setForm({
      ...emptyForm,
    })
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="anggota-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="content-header">
        <div>
          <h1>Daftar Anggota</h1>

          <p>
            Kelola data anggota dan keluarga Punguan Gultom.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAdd}
          >
            + Tambah Anggota
          </button>
        </div>
      </div>

      {/* =====================================================
          STATISTIK
      ===================================================== */}

      <section className="stats-grid anggota-stats">

        <div className="stat-card stat-members">
          <div className="stat-top">
            <div className="stat-label">
              Total Keluarga
            </div>

            <div className="stat-icon">
              👥
            </div>
          </div>

          <div className="stat-value">
            {totalAnggota}
          </div>

          <div className="stat-change success-text">
            Data keluarga terdaftar
          </div>
        </div>

        <div className="stat-card stat-balance">
          <div className="stat-top">
            <div className="stat-label">
              Data Ditampilkan
            </div>

            <div className="stat-icon">
              ▣
            </div>
          </div>

          <div className="stat-value">
            {totalDitampilkan}
          </div>

          <div className="stat-change success-text">
            Berdasarkan filter aktif
          </div>
        </div>

      </section>

      {/* =====================================================
          DATA ANGGOTA
      ===================================================== */}

      <section className="card">

        <div className="card-header anggota-card-header">
          <div>
            <h3 className="card-title">
              Data Anggota
            </h3>

            <div className="card-subtitle">
              Daftar keluarga Punguan Gultom
            </div>
          </div>
        </div>

        {/* ===================================================
            FILTER
        =================================================== */}

        <div className="anggota-filter">

          {/* SEARCH */}

          <div className="filter-group filter-search">
            <label>
              Cari Anggota
            </label>

            <input
              type="text"
              value={search}
              placeholder="Cari nama, No. HP, alamat, wilayah..."
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {/* WILAYAH */}

          <div className="filter-group">
            <label>
              Wilayah
            </label>

            <input
              type="text"
              value={filterWilayah}
              placeholder="Cari wilayah..."
              onChange={(event) =>
                setFilterWilayah(event.target.value)
              }
            />
          </div>

          {/* STATUS */}

          <div className="filter-group">
            <label>
              Status Kekerabatan
            </label>

            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(event.target.value)
              }
            >
              <option value="">
                Semua Status
              </option>

              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* RESET */}

          {hasActiveFilter && (
            <div className="filter-reset-wrapper">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetFilter}
              >
                Reset Filter
              </button>
            </div>
          )}

        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="table-wrapper">

          <table className="data-table anggota-table">

            <thead>
              <tr>
                <th>KELUARGA</th>
                <th>ISTRI</th>
                <th>ANAK</th>
                <th>WILAYAH</th>
                <th>STATUS</th>
                <th>NO. HP</th>
                <th>AKSI</th>
              </tr>
            </thead>

            <tbody>

              {filteredMembers.map((member) => {
                const initials =
                  `${member.namaSuami?.charAt(0) || ''}${member.namaIstri?.charAt(0) || ''}`
                    .toUpperCase()

                return (
                  <tr key={member.id}>

                    {/* KELUARGA */}

                    <td>
                      <div className="member-cell">

                        <div className="member-avatar">
                          {initials}
                        </div>

                        <div>
                          <div className="member-name">
                            {member.namaSuami}
                          </div>

                          <div className="member-secondary">
                            Kepala Keluarga
                          </div>
                        </div>

                      </div>
                    </td>

                    {/* ISTRI */}

                    <td>
                      {member.namaIstri || '-'}
                    </td>

                    {/* ANAK */}

                    <td>
                      {member.jumlahAnak ?? 0}
                    </td>

                    {/* WILAYAH */}

                    <td>
                      {member.wilayah || '-'}
                    </td>

                    {/* STATUS */}

                    <td>
                      <span className="badge badge-info">
                        {member.status || '-'}
                      </span>
                    </td>

                    {/* NO HP */}

                    <td>
                      {member.noHp || '-'}
                    </td>

                    {/* AKSI */}

                    <td>
                      <div className="member-actions">

                        <button
                          type="button"
                          className="action-btn action-view"
                          title="Lihat Detail"
                          onClick={() =>
                            setSelectedMember(member)
                          }
                        >
                          Lihat
                        </button>

                        <button
                          type="button"
                          className="action-btn action-edit"
                          title="Edit"
                          onClick={() =>
                            handleEdit(member)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="action-btn action-delete"
                          title="Hapus"
                          onClick={() =>
                            handleDelete(member)
                          }
                        >
                          Hapus
                        </button>

                      </div>
                    </td>

                  </tr>
                )
              })}

            </tbody>

          </table>

          {/* EMPTY STATE */}

          {filteredMembers.length === 0 && (
            <div className="empty-search">
              {hasActiveFilter
                ? 'Tidak ada anggota yang sesuai dengan filter.'
                : 'Belum ada data anggota.'}
            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          MODAL TAMBAH / EDIT
      ===================================================== */}

      {showForm && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <h2>
                  {editingId !== null
                    ? 'Edit Anggota'
                    : 'Tambah Anggota'}
                </h2>

                <p>
                  Masukkan data keluarga anggota.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={handleCloseForm}
                aria-label="Tutup"
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="modal-body">

                <div className="form-grid">

                  {/* NAMA SUAMI */}

                  <div className="form-group">
                    <label>
                      Nama Suami *
                    </label>

                    <input
                      type="text"
                      name="namaSuami"
                      value={form.namaSuami}
                      onChange={handleChange}
                      placeholder="Masukkan nama suami"
                    />
                  </div>

                  {/* NAMA ISTRI */}

                  <div className="form-group">
                    <label>
                      Nama Istri *
                    </label>

                    <input
                      type="text"
                      name="namaIstri"
                      value={form.namaIstri}
                      onChange={handleChange}
                      placeholder="Masukkan nama istri"
                    />
                  </div>

                  {/* JUMLAH ANAK */}

                  <div className="form-group">
                    <label>
                      Jumlah Anak
                    </label>

                    <input
                      type="number"
                      name="jumlahAnak"
                      min="0"
                      step="1"
                      value={form.jumlahAnak}
                      onChange={handleChange}
                      placeholder="Contoh: 2"
                    />
                  </div>

                  {/* NO HP */}

                  <div className="form-group">
                    <label>
                      No. HP
                    </label>

                    <input
                      type="tel"
                      name="noHp"
                      value={form.noHp}
                      onChange={handleChange}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>

                  {/* ALAMAT */}

                  <div className="form-group form-group-full">
                    <label>
                      Alamat
                    </label>

                    <textarea
                      name="alamat"
                      value={form.alamat}
                      onChange={handleChange}
                      placeholder="Masukkan alamat lengkap"
                      rows={3}
                    />
                  </div>

                  {/* WILAYAH */}

                  <div className="form-group form-group-full">
                    <label>
                      Wilayah *
                    </label>

                    <textarea
                      name="wilayah"
                      value={form.wilayah}
                      onChange={handleChange}
                      placeholder="Masukkan wilayah secara manual, contoh: Jakarta Selatan"
                      rows={3}
                    />

                    <small>
                      Wilayah dapat diisi secara manual sesuai
                      pembagian wilayah punguan.
                    </small>
                  </div>

                  {/* STATUS */}

                  <div className="form-group">
                    <label>
                      Status Kekerabatan *
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="">
                        Pilih Status
                      </option>

                      {STATUS_OPTIONS.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseForm}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingId !== null
                    ? 'Simpan Perubahan'
                    : 'Simpan Anggota'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          MODAL DETAIL ANGGOTA
      ===================================================== */}

      {selectedMember && (
        <div className="modal-overlay">

          <div className="modal detail-modal">

            <div className="modal-header">

              <div>
                <h2>
                  Detail Keluarga
                </h2>

                <p>
                  Informasi lengkap anggota.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedMember(null)
                }
                aria-label="Tutup"
              >
                ×
              </button>

            </div>

            <div className="modal-body">

              <div className="detail-profile">

                <div className="detail-avatar">
                  {`${selectedMember.namaSuami?.charAt(0) || ''}${selectedMember.namaIstri?.charAt(0) || ''}`
                    .toUpperCase()}
                </div>

                <div>
                  <h3>
                    {selectedMember.namaSuami}
                  </h3>

                  <p>
                    Kepala Keluarga
                  </p>
                </div>

              </div>

              <div className="detail-grid">

                <div className="detail-item">
                  <span>
                    Nama Suami
                  </span>

                  <strong>
                    {selectedMember.namaSuami || '-'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Nama Istri
                  </span>

                  <strong>
                    {selectedMember.namaIstri || '-'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Jumlah Anak
                  </span>

                  <strong>
                    {selectedMember.jumlahAnak ?? 0}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    No. HP
                  </span>

                  <strong>
                    {selectedMember.noHp || '-'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Wilayah
                  </span>

                  <strong>
                    {selectedMember.wilayah || '-'}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Status Kekerabatan
                  </span>

                  <strong>
                    {selectedMember.status || '-'}
                  </strong>
                </div>

                <div className="detail-item detail-item-full">
                  <span>
                    Alamat
                  </span>

                  <strong>
                    {selectedMember.alamat || '-'}
                  </strong>
                </div>

              </div>

            </div>

            <div className="modal-footer">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setSelectedMember(null)
                }
              >
                Tutup
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const member = selectedMember

                  setSelectedMember(null)
                  handleEdit(member)
                }}
              >
                Edit Data
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default Anggota