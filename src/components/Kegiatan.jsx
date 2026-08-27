import { useMemo, useState } from 'react'

import {
  getKegiatan,
  saveKegiatan,
} from '../utils/storage'

// =========================================
// KONSTANTA
// =========================================

const MAX_INPUT_FILE_SIZE = 10 * 1024 * 1024

const MAX_COMPRESSED_FILE_SIZE =
  1024 * 1024

const MAX_IMAGE_WIDTH = 1600
const MAX_IMAGE_HEIGHT = 1600

const emptyForm = {
  jenisKegiatan: '',
  tanggal: '',
  keterangan: '',
  status: '',
  foto: '',
  fotoNama: '',
}

// =========================================
// KOMPRESI FOTO
// =========================================

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(
        new Error('File foto tidak ditemukan.')
      )

      return
    }

    if (!file.type.startsWith('image/')) {
      reject(
        new Error(
          'File yang dipilih harus berupa gambar.'
        )
      )

      return
    }

    if (file.size > MAX_INPUT_FILE_SIZE) {
      reject(
        new Error(
          'Ukuran foto asli maksimal 10 MB.'
        )
      )

      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      const image = new Image()

      image.onload = () => {
        let width = image.width
        let height = image.height

        // =====================================
        // RESIZE
        // =====================================

        if (
          width > MAX_IMAGE_WIDTH ||
          height > MAX_IMAGE_HEIGHT
        ) {
          const widthRatio =
            MAX_IMAGE_WIDTH / width

          const heightRatio =
            MAX_IMAGE_HEIGHT / height

          const ratio = Math.min(
            widthRatio,
            heightRatio
          )

          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas =
          document.createElement('canvas')

        canvas.width = width
        canvas.height = height

        const context =
          canvas.getContext('2d')

        if (!context) {
          reject(
            new Error(
              'Browser tidak mendukung proses kompresi foto.'
            )
          )

          return
        }

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        )

        // =====================================
        // KOMPRESI BERTAHAP
        // =====================================

        let quality = 0.82

        const generateCompressedImage = () => {
          const dataUrl =
            canvas.toDataURL(
              'image/jpeg',
              quality
            )

          const base64Length =
            dataUrl.length -
            'data:image/jpeg;base64,'.length

          const approximateSize =
            Math.ceil(
              (base64Length * 3) / 4
            )

          if (
            approximateSize <=
              MAX_COMPRESSED_FILE_SIZE ||
            quality <= 0.4
          ) {
            resolve({
              dataUrl,
              size: approximateSize,
              name: file.name,
              type: 'image/jpeg',
              width,
              height,
            })

            return
          }

          quality -= 0.08

          generateCompressedImage()
        }

        generateCompressedImage()
      }

      image.onerror = () => {
        reject(
          new Error(
            'Foto tidak dapat diproses.'
          )
        )
      }

      image.src = event.target.result
    }

    reader.onerror = () => {
      reject(
        new Error(
          'Gagal membaca file foto.'
        )
      )
    }

    reader.readAsDataURL(file)
  })
}

// =========================================
// FORMAT TANGGAL
// =========================================

function formatTanggal(tanggal) {
  if (!tanggal) {
    return '-'
  }

  const date = new Date(
    `${tanggal}T00:00:00`
  )

  if (Number.isNaN(date.getTime())) {
    return tanggal
  }

  return date.toLocaleDateString(
    'id-ID',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  )
}

// =========================================
// FORMAT UKURAN FOTO
// =========================================

function formatFileSize(bytes) {
  if (!bytes) {
    return '0 KB'
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(
      bytes / 1024
    )} KB`
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`
}

// =========================================
// COMPONENT
// =========================================

function Kegiatan() {
  // =======================================
  // STATE
  // =======================================

  const [kegiatan, setKegiatan] =
    useState(() => {
      const data = getKegiatan()

      return Array.isArray(data)
        ? data
        : []
    })

  const [search, setSearch] = useState('')

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState(null)

  const [selectedKegiatan, setSelectedKegiatan] =
    useState(null)

  const [form, setForm] = useState({
    ...emptyForm,
  })

  const [fotoPreview, setFotoPreview] =
    useState('')

  const [fotoSize, setFotoSize] =
    useState(0)

  const [isCompressing, setIsCompressing] =
    useState(false)

  // =======================================
  // FILTER
  // =======================================

  const filteredKegiatan = useMemo(() => {
    const keyword =
      search.trim().toLowerCase()

    if (!keyword) {
      return kegiatan
    }

    return kegiatan.filter(
      (item) => {
        const jenisKegiatan =
          String(
            item.jenisKegiatan || ''
          ).toLowerCase()

        const keterangan =
          String(
            item.keterangan || ''
          ).toLowerCase()

        const status =
          String(
            item.status || ''
          ).toLowerCase()

        const tanggal =
          String(
            item.tanggal || ''
          ).toLowerCase()

        return (
          jenisKegiatan.includes(keyword) ||
          keterangan.includes(keyword) ||
          status.includes(keyword) ||
          tanggal.includes(keyword)
        )
      }
    )
  }, [kegiatan, search])

  // =======================================
  // STATISTIK
  // =======================================

  const totalKegiatan =
    kegiatan.length

  const totalDitampilkan =
    filteredKegiatan.length

  const totalDenganFoto =
    kegiatan.filter(
      (item) => item.foto
    ).length

  // =======================================
  // HANDLE CHANGE
  // =======================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  // =======================================
  // TAMBAH
  // =======================================

  const handleAdd = () => {
    setEditingId(null)

    setForm({
      ...emptyForm,
    })

    setFotoPreview('')
    setFotoSize(0)

    setShowForm(true)
  }

  // =======================================
  // EDIT
  // =======================================

  const handleEdit = (item) => {
    setEditingId(item.id)

    setForm({
      jenisKegiatan:
        item.jenisKegiatan || '',

      tanggal:
        item.tanggal || '',

      keterangan:
        item.keterangan || '',

      status:
        item.status || '',

      foto:
        item.foto || '',

      fotoNama:
        item.fotoNama || '',
    })

    setFotoPreview(
      item.foto || ''
    )

    setFotoSize(
      item.fotoSize || 0
    )

    setShowForm(true)
  }

  // =======================================
  // UPLOAD FOTO
  // =======================================

  const handleFotoChange = async (
    event
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    setIsCompressing(true)

    try {
      const compressed =
        await compressImage(file)

      setForm((previous) => ({
        ...previous,
        foto: compressed.dataUrl,
        fotoNama: file.name,
      }))

      setFotoPreview(
        compressed.dataUrl
      )

      setFotoSize(
        compressed.size
      )
    } catch (error) {
      console.error(
        'Gagal memproses foto:',
        error
      )

      alert(
        error.message ||
          'Gagal memproses foto.'
      )

      event.target.value = ''
    } finally {
      setIsCompressing(false)
    }
  }

  // =======================================
  // HAPUS / RESET FOTO
  // =======================================

  const handleRemoveFoto = () => {
    setForm((previous) => ({
      ...previous,
      foto: '',
      fotoNama: '',
    }))

    setFotoPreview('')
    setFotoSize(0)
  }

  // =======================================
  // SIMPAN
  // =======================================

  const handleSubmit = (event) => {
    event.preventDefault()

    // =====================================
    // VALIDASI
    // =====================================

    if (
      !form.jenisKegiatan.trim()
    ) {
      alert(
        'Jenis kegiatan wajib diisi.'
      )

      return
    }

    if (!form.tanggal) {
      alert(
        'Tanggal kegiatan wajib diisi.'
      )

      return
    }

    if (!form.keterangan.trim()) {
      alert(
        'Keterangan kegiatan wajib diisi.'
      )

      return
    }

    if (!form.status.trim()) {
      alert(
        'Status kegiatan wajib diisi.'
      )

      return
    }

    // =====================================
    // EDIT DATA
    // =====================================

    if (editingId !== null) {
      const updatedKegiatan =
        kegiatan.map((item) => {
          if (
            item.id !== editingId
          ) {
            return item
          }

          return {
            ...item,

            jenisKegiatan:
              form.jenisKegiatan.trim(),

            tanggal:
              form.tanggal,

            keterangan:
              form.keterangan.trim(),

            status:
              form.status.trim(),

            foto:
              form.foto || '',

            fotoNama:
              form.fotoNama || '',

            fotoSize:
              fotoSize || 0,

            updatedAt:
              new Date().toISOString(),
          }
        })

      const saved =
        saveKegiatan(
          updatedKegiatan
        )

      if (!saved) {
        alert(
          'Data gagal disimpan. Kemungkinan penyimpanan browser sudah penuh.'
        )

        return
      }

      setKegiatan(
        updatedKegiatan
      )

      handleCloseForm()

      return
    }

    // =====================================
    // DATA BARU
    // =====================================

    const newKegiatan = {
      id: crypto.randomUUID(),

      jenisKegiatan:
        form.jenisKegiatan.trim(),

      tanggal:
        form.tanggal,

      keterangan:
        form.keterangan.trim(),

      status:
        form.status.trim(),

      foto:
        form.foto || '',

      fotoNama:
        form.fotoNama || '',

      fotoSize:
        fotoSize || 0,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    }

    const updatedKegiatan = [
      ...kegiatan,
      newKegiatan,
    ]

    const saved =
      saveKegiatan(
        updatedKegiatan
      )

    if (!saved) {
      alert(
        'Data gagal disimpan. Kemungkinan penyimpanan browser sudah penuh. Jika menggunakan foto, coba gunakan foto yang lebih kecil.'
      )

      return
    }

    setKegiatan(
      updatedKegiatan
    )

    handleCloseForm()
  }

  // =======================================
  // HAPUS KEGIATAN
  // =======================================

  const handleDelete = (item) => {
    const confirmed =
      window.confirm(
        `Apakah Anda yakin ingin menghapus kegiatan "${item.jenisKegiatan}"?`
      )

    if (!confirmed) {
      return
    }

    const updatedKegiatan =
      kegiatan.filter(
        (kegiatanItem) =>
          kegiatanItem.id !== item.id
      )

    const saved =
      saveKegiatan(
        updatedKegiatan
      )

    if (!saved) {
      alert(
        'Data gagal dihapus.'
      )

      return
    }

    setKegiatan(
      updatedKegiatan
    )

    if (
      selectedKegiatan &&
      selectedKegiatan.id ===
        item.id
    ) {
      setSelectedKegiatan(null)
    }
  }

  // =======================================
  // CLOSE FORM
  // =======================================

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)

    setForm({
      ...emptyForm,
    })

    setFotoPreview('')
    setFotoSize(0)
    setIsCompressing(false)
  }

  // =======================================
  // RENDER
  // =======================================

  return (
    <div className="kegiatan-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="content-header">

        <div>
          <h1>
            Kegiatan Punguan
          </h1>

          <p>
            Kelola kegiatan dan
            dokumentasi Punguan
            Gultom.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAdd}
          >
            + Tambah Kegiatan
          </button>
        </div>

      </div>

      {/* =====================================
          STATISTIK
      ===================================== */}

      <section className="stats-grid anggota-stats">

        <div className="stat-card stat-members">

          <div className="stat-top">

            <div className="stat-label">
              Total Kegiatan
            </div>

            <div className="stat-icon">
              ◷
            </div>

          </div>

          <div className="stat-value">
            {totalKegiatan}
          </div>

          <div className="stat-change success-text">
            Kegiatan terdaftar
          </div>

        </div>

        <div className="stat-card stat-balance">

          <div className="stat-top">

            <div className="stat-label">
              Ditampilkan
            </div>

            <div className="stat-icon">
              ▣
            </div>

          </div>

          <div className="stat-value">
            {totalDitampilkan}
          </div>

          <div className="stat-change success-text">
            Berdasarkan pencarian
          </div>

        </div>

        <div className="stat-card stat-members">

          <div className="stat-top">

            <div className="stat-label">
              Dokumentasi Foto
            </div>

            <div className="stat-icon">
              📷
            </div>

          </div>

          <div className="stat-value">
            {totalDenganFoto}
          </div>

          <div className="stat-change success-text">
            Kegiatan memiliki foto
          </div>

        </div>

      </section>

      {/* =====================================
          DATA KEGIATAN
      ===================================== */}

      <section className="card">

        <div className="card-header anggota-card-header">

          <div>

            <h3 className="card-title">
              Daftar Kegiatan
            </h3>

            <div className="card-subtitle">
              Data kegiatan Punguan
              Gultom
            </div>

          </div>

        </div>

        {/* ===================================
            FILTER
        =================================== */}

        <div className="anggota-filter">

          <div className="filter-group filter-search">

            <label>
              Cari Kegiatan
            </label>

            <input
              type="text"
              value={search}
              placeholder="Cari jenis kegiatan, keterangan, status..."
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          {search && (
            <div className="filter-reset-wrapper">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setSearch('')
                }
              >
                Reset Pencarian
              </button>

            </div>
          )}

        </div>

        {/* ===================================
            TABLE
        =================================== */}

        <div className="table-wrapper">

          <table className="data-table anggota-table">

            <thead>
              <tr>

                <th>
                  JENIS KEGIATAN
                </th>

                <th>
                  TANGGAL
                </th>

                <th>
                  KETERANGAN
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  FOTO
                </th>

                <th>
                  AKSI
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredKegiatan.map(
                (item) => (
                  <tr key={item.id}>

                    <td>
                      <div className="member-cell">

                        <div className="member-avatar">
                          {item.jenisKegiatan
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            'K'}
                        </div>

                        <div>
                          <div className="member-name">
                            {
                              item.jenisKegiatan
                            }
                          </div>

                          <div className="member-secondary">
                            Kegiatan Punguan
                          </div>
                        </div>

                      </div>
                    </td>

                    <td>
                      {formatTanggal(
                        item.tanggal
                      )}
                    </td>

                    <td>
                      <div
                        style={{
                          maxWidth:
                            '280px',
                          whiteSpace:
                            'nowrap',
                          overflow:
                            'hidden',
                          textOverflow:
                            'ellipsis',
                        }}
                        title={
                          item.keterangan
                        }
                      >
                        {
                          item.keterangan
                        }
                      </div>
                    </td>

                    <td>
                      <div
                        style={{
                          maxWidth:
                            '220px',
                          whiteSpace:
                            'nowrap',
                          overflow:
                            'hidden',
                          textOverflow:
                            'ellipsis',
                        }}
                        title={
                          item.status
                        }
                      >
                        {item.status}
                      </div>
                    </td>

                    <td>

                      {item.foto ? (
                        <span
                          className="badge badge-info"
                        >
                          📷 Ada Foto
                        </span>
                      ) : (
                        <span>
                          -
                        </span>
                      )}

                    </td>

                    <td>

                      <div className="member-actions">

                        <button
                          type="button"
                          className="action-btn action-view"
                          title="Lihat Detail"
                          onClick={() =>
                            setSelectedKegiatan(
                              item
                            )
                          }
                        >
                          Lihat
                        </button>

                        <button
                          type="button"
                          className="action-btn action-edit"
                          title="Edit"
                          onClick={() =>
                            handleEdit(
                              item
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="action-btn action-delete"
                          title="Hapus"
                          onClick={() =>
                            handleDelete(
                              item
                            )
                          }
                        >
                          Hapus
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

          {/* =================================
              EMPTY STATE
          ================================= */}

          {filteredKegiatan.length ===
            0 && (
            <div className="empty-search">

              {search
                ? 'Tidak ada kegiatan yang sesuai dengan pencarian.'
                : 'Belum ada data kegiatan.'}

            </div>
          )}

        </div>

      </section>

      {/* =====================================
          MODAL TAMBAH / EDIT
      ===================================== */}

      {showForm && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingId !== null
                    ? 'Edit Kegiatan'
                    : 'Tambah Kegiatan'}
                </h2>

                <p>
                  Masukkan data kegiatan
                  Punguan Gultom.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  handleCloseForm
                }
                aria-label="Tutup"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
            >

              <div className="modal-body">

                <div className="form-grid">

                  {/* JENIS KEGIATAN */}

                  <div className="form-group">

                    <label>
                      Jenis Kegiatan *
                    </label>

                    <input
                      type="text"
                      name="jenisKegiatan"
                      value={
                        form.jenisKegiatan
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Contoh: Rapat Pengurus"
                    />

                  </div>

                  {/* TANGGAL */}

                  <div className="form-group">

                    <label>
                      Tanggal *
                    </label>

                    <input
                      type="date"
                      name="tanggal"
                      value={
                        form.tanggal
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                  {/* KETERANGAN */}

                  <div className="form-group form-group-full">

                    <label>
                      Keterangan *
                    </label>

                    <textarea
                      name="keterangan"
                      value={
                        form.keterangan
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Masukkan keterangan kegiatan..."
                      rows={4}
                    />

                  </div>

                  {/* STATUS */}

                  <div className="form-group form-group-full">

                    <label>
                      Status *
                    </label>

                    <textarea
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Jelaskan status kegiatan..."
                      rows={3}
                    />

                  </div>

                  {/* FOTO */}

                  <div className="form-group form-group-full">

                    <label>
                      Foto Dokumentasi
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleFotoChange
                      }
                      disabled={
                        isCompressing
                      }
                    />

                    <small
                      style={{
                        display:
                          'block',
                        marginTop:
                          '8px',
                        opacity:
                          0.7,
                      }}
                    >
                      Foto akan otomatis
                      diperkecil dan
                      dikompresi. Ukuran
                      file asli maksimal
                      10 MB.
                    </small>

                    {/* LOADING */}

                    {isCompressing && (
                      <div
                        style={{
                          marginTop:
                            '15px',
                        }}
                      >
                        Memproses dan
                        mengompresi foto...
                      </div>
                    )}

                    {/* PREVIEW */}

                    {fotoPreview &&
                      !isCompressing && (
                        <div
                          style={{
                            marginTop:
                              '15px',
                            border:
                              '1px solid #ddd',
                            borderRadius:
                              '10px',
                            padding:
                              '12px',
                          }}
                        >

                          <img
                            src={
                              fotoPreview
                            }
                            alt="Preview dokumentasi"
                            style={{
                              display:
                                'block',
                              width:
                                '100%',
                              maxHeight:
                                '300px',
                              objectFit:
                                'contain',
                              borderRadius:
                                '8px',
                            }}
                          />

                          <div
                            style={{
                              marginTop:
                                '10px',
                              fontSize:
                                '13px',
                            }}
                          >
                            <strong>
                              {
                                form.fotoNama
                              }
                            </strong>

                            <div>
                              Ukuran setelah
                              kompresi:{' '}
                              {formatFileSize(
                                fotoSize
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              marginTop:
                                '10px',
                            }}
                            onClick={
                              handleRemoveFoto
                            }
                          >
                            Hapus Foto
                          </button>

                        </div>
                      )}

                  </div>

                </div>

              </div>

              {/* FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    handleCloseForm
                  }
                  disabled={
                    isCompressing
                  }
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    isCompressing
                  }
                >
                  {editingId !== null
                    ? 'Simpan Perubahan'
                    : 'Simpan Kegiatan'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================
          MODAL DETAIL
      ===================================== */}

      {selectedKegiatan && (
        <div className="modal-overlay">

          <div className="modal detail-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Detail Kegiatan
                </h2>

                <p>
                  Informasi lengkap
                  kegiatan.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedKegiatan(
                    null
                  )
                }
                aria-label="Tutup"
              >
                ×
              </button>

            </div>

            <div className="modal-body">

              {/* PROFILE */}

              <div className="detail-profile">

                <div className="detail-avatar">
                  {selectedKegiatan
                    .jenisKegiatan
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    'K'}
                </div>

                <div>

                  <h3>
                    {
                      selectedKegiatan.jenisKegiatan
                    }
                  </h3>

                  <p>
                    {formatTanggal(
                      selectedKegiatan.tanggal
                    )}
                  </p>

                </div>

              </div>

              {/* DETAIL */}

              <div className="detail-grid">

                <div className="detail-item">

                  <span>
                    Jenis Kegiatan
                  </span>

                  <strong>
                    {
                      selectedKegiatan.jenisKegiatan ||
                      '-'
                    }
                  </strong>

                </div>

                <div className="detail-item">

                  <span>
                    Tanggal
                  </span>

                  <strong>
                    {formatTanggal(
                      selectedKegiatan.tanggal
                    )}
                  </strong>

                </div>

                <div className="detail-item detail-item-full">

                  <span>
                    Keterangan
                  </span>

                  <strong
                    style={{
                      whiteSpace:
                        'pre-wrap',
                    }}
                  >
                    {
                      selectedKegiatan.keterangan ||
                      '-'
                    }
                  </strong>

                </div>

                <div className="detail-item detail-item-full">

                  <span>
                    Status
                  </span>

                  <strong
                    style={{
                      whiteSpace:
                        'pre-wrap',
                    }}
                  >
                    {
                      selectedKegiatan.status ||
                      '-'
                    }
                  </strong>

                </div>

              </div>

              {/* FOTO */}

              {selectedKegiatan.foto && (
                <div
                  style={{
                    marginTop:
                      '25px',
                  }}
                >

                  <div
                    style={{
                      fontWeight:
                        '600',
                      marginBottom:
                        '10px',
                    }}
                  >
                    Foto Dokumentasi
                  </div>

                  <img
                    src={
                      selectedKegiatan.foto
                    }
                    alt={
                      selectedKegiatan.fotoNama ||
                      'Foto dokumentasi kegiatan'
                    }
                    style={{
                      display:
                        'block',
                      width:
                        '100%',
                      maxHeight:
                        '500px',
                      objectFit:
                        'contain',
                      borderRadius:
                        '10px',
                    }}
                  />

                  {selectedKegiatan.fotoNama && (
                    <div
                      style={{
                        marginTop:
                          '10px',
                        fontSize:
                          '13px',
                        opacity:
                          0.7,
                      }}
                    >
                      {
                        selectedKegiatan.fotoNama
                      }
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* DETAIL FOOTER */}

            <div className="modal-footer">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setSelectedKegiatan(
                    null
                  )
                }
              >
                Tutup
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const item =
                    selectedKegiatan

                  setSelectedKegiatan(
                    null
                  )

                  handleEdit(item)
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

export default Kegiatan