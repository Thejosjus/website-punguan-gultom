import { useMemo, useState } from 'react'
import {
  getADRT,
  saveADRT,
} from '../utils/storage'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_FILE_TYPES = [
  'application/pdf',
]

const ALLOWED_EXTENSIONS = ['pdf']

const CATEGORY_OPTIONS = [
  'Anggaran Dasar',
  'Anggaran Rumah Tangga',
  'Peraturan Organisasi',
  'Revisi',
  'Lampiran',
  'Lainnya',
]

const emptyForm = {
  judul: '',
  kategori: '',
  nomorDokumen: '',
  tanggal: '',
  keterangan: '',
  file: null,
}

function formatFileSize(bytes) {
  if (!bytes) {
    return '0 B'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getExtension(fileName) {
  const parts = String(fileName || '')
    .toLowerCase()
    .split('.')

  return parts.length > 1
    ? parts.pop()
    : ''
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result)
    }

    reader.onerror = () => {
      reject(
        new Error('Gagal membaca file.')
      )
    }

    reader.readAsDataURL(file)
  })
}

function ADRT() {
  const [documents, setDocuments] = useState(() => {
    const data = getADRT()

    return Array.isArray(data) ? data : []
  })

  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedDocument, setSelectedDocument] =
    useState(null)

  const [form, setForm] = useState({
    ...emptyForm,
  })

  const filteredDocuments = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase()

    return documents.filter((document) => {
      const judul = String(
        document.judul || ''
      ).toLowerCase()

      const nomorDokumen = String(
        document.nomorDokumen || ''
      ).toLowerCase()

      const keterangan = String(
        document.keterangan || ''
      ).toLowerCase()

      const matchesSearch =
        keyword === '' ||
        judul.includes(keyword) ||
        nomorDokumen.includes(keyword) ||
        keterangan.includes(keyword)

      const matchesKategori =
        filterKategori === '' ||
        document.kategori === filterKategori

      return (
        matchesSearch &&
        matchesKategori
      )
    })
  }, [
    documents,
    search,
    filterKategori,
  ])

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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const extension = getExtension(
      file.name
    )

    if (
      !ALLOWED_EXTENSIONS.includes(
        extension
      ) ||
      !ALLOWED_FILE_TYPES.includes(
        file.type
      )
    ) {
      alert(
        'File AD/RT harus berupa PDF.'
      )

      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(
        'Ukuran file maksimal 5 MB.'
      )

      event.target.value = ''
      return
    }

    setForm((previous) => ({
      ...previous,
      file,
    }))
  }

  const handleAdd = () => {
    setEditingId(null)

    setForm({
      ...emptyForm,
    })

    setShowForm(true)
  }

  const handleEdit = (document) => {
    setEditingId(document.id)

    setForm({
      judul: document.judul || '',
      kategori: document.kategori || '',
      nomorDokumen:
        document.nomorDokumen || '',
      tanggal: document.tanggal || '',
      keterangan:
        document.keterangan || '',
      file: null,
    })

    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)

    setForm({
      ...emptyForm,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.judul.trim()) {
      alert('Judul dokumen wajib diisi.')
      return
    }

    if (!form.kategori) {
      alert('Kategori wajib dipilih.')
      return
    }

    if (editingId === null && !form.file) {
      alert('File PDF wajib diupload.')
      return
    }

    try {
      let fileData = null
      let fileName = ''
      let fileType = ''
      let fileSize = 0
      let fileExtension = ''

      if (form.file) {
        fileData =
          await readFileAsBase64(
            form.file
          )

        fileName = form.file.name
        fileType = form.file.type
        fileSize = form.file.size
        fileExtension =
          getExtension(form.file.name)
      }

      if (editingId !== null) {
        const updatedDocuments =
          documents.map((document) => {
            if (
              document.id !==
              editingId
            ) {
              return document
            }

            return {
              ...document,
              judul:
                form.judul.trim(),
              kategori:
                form.kategori,
              nomorDokumen:
                form.nomorDokumen.trim(),
              tanggal:
                form.tanggal,
              keterangan:
                form.keterangan.trim(),

              ...(form.file
                ? {
                    fileData,
                    fileName,
                    fileType,
                    fileSize,
                    fileExtension,
                    fileUpdatedAt:
                      new Date().toISOString(),
                  }
                : {}),
            }
          })

        const saved =
          saveADRT(updatedDocuments)

        if (!saved) {
          alert(
            'Gagal menyimpan perubahan. Storage browser mungkin penuh.'
          )
          return
        }

        setDocuments(updatedDocuments)
        handleCloseForm()
        return
      }

      const newDocument = {
        id: crypto.randomUUID(),

        judul:
          form.judul.trim(),

        kategori:
          form.kategori,

        nomorDokumen:
          form.nomorDokumen.trim(),

        tanggal:
          form.tanggal,

        keterangan:
          form.keterangan.trim(),

        fileName,
        fileType,
        fileSize,
        fileExtension,
        fileData,

        storageType:
          'localStorage',

        fileId: null,
        fileUrl: null,

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),
      }

      const updatedDocuments = [
        ...documents,
        newDocument,
      ]

      const saved =
        saveADRT(updatedDocuments)

      if (!saved) {
        alert(
          'Gagal menyimpan dokumen. Storage browser mungkin penuh.'
        )
        return
      }

      setDocuments(updatedDocuments)
      handleCloseForm()
    } catch (error) {
      console.error(
        'Gagal menyimpan dokumen AD/RT:',
        error
      )

      alert(
        'Gagal memproses file. Silakan coba file lain.'
      )
    }
  }

  const handleDelete = (document) => {
    const confirmed =
      window.confirm(
        `Apakah Anda yakin ingin menghapus dokumen "${document.judul}"?`
      )

    if (!confirmed) {
      return
    }

    const updatedDocuments =
      documents.filter(
        (item) =>
          item.id !== document.id
      )

    const saved =
      saveADRT(updatedDocuments)

    if (!saved) {
      alert(
        'Gagal menghapus dokumen.'
      )
      return
    }

    setDocuments(updatedDocuments)

    if (
      selectedDocument?.id ===
      document.id
    ) {
      setSelectedDocument(null)
    }
  }

  const handleDownload = (document) => {
    if (!document.fileData) {
      alert(
        'Data file tidak tersedia.'
      )
      return
    }

    const link =
      window.document.createElement(
        'a'
      )

    link.href = document.fileData
    link.download =
      document.fileName ||
      'dokumen-adrt.pdf'

    window.document.body.appendChild(
      link
    )

    link.click()
    link.remove()
  }

  const handlePreview = (document) => {
    if (!document.fileData) {
      alert(
        'Data file tidak tersedia.'
      )
      return
    }

    window.open(
      document.fileData,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleResetFilter = () => {
    setSearch('')
    setFilterKategori('')
  }

  const hasActiveFilter =
    search !== '' ||
    filterKategori !== ''

  const totalDokumen =
    documents.length

  const totalDitampilkan =
    filteredDocuments.length

  return (
    <div className="anggota-page">

      <div className="content-header">
        <div>
          <h1>AD / RT</h1>

          <p>
            Arsip Anggaran Dasar dan
            Anggaran Rumah Tangga
            Punguan Gultom.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAdd}
          >
            + Tambah Dokumen
          </button>
        </div>
      </div>

      <section className="stats-grid anggota-stats">

        <div className="stat-card stat-members">
          <div className="stat-top">
            <div className="stat-label">
              Total Dokumen
            </div>

            <div className="stat-icon">
              📄
            </div>
          </div>

          <div className="stat-value">
            {totalDokumen}
          </div>

          <div className="stat-change success-text">
            Dokumen AD / RT tersimpan
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
            Berdasarkan filter
          </div>
        </div>

      </section>

      <section className="card">

        <div className="card-header anggota-card-header">
          <div>
            <h3 className="card-title">
              Arsip AD / RT
            </h3>

            <div className="card-subtitle">
              Dokumen resmi organisasi
            </div>
          </div>
        </div>

        <div className="anggota-filter">

          <div className="filter-group filter-search">
            <label>
              Cari Dokumen
            </label>

            <input
              type="text"
              value={search}
              placeholder="Cari judul, nomor, keterangan..."
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="filter-group">
            <label>
              Kategori
            </label>

            <select
              value={filterKategori}
              onChange={(event) =>
                setFilterKategori(
                  event.target.value
                )
              }
            >
              <option value="">
                Semua Kategori
              </option>

              {CATEGORY_OPTIONS.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>

          {hasActiveFilter && (
            <div className="filter-reset-wrapper">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={
                  handleResetFilter
                }
              >
                Reset Filter
              </button>
            </div>
          )}

        </div>

        <div className="table-wrapper">

          <table className="data-table anggota-table">

            <thead>
              <tr>
                <th>DOKUMEN</th>
                <th>KATEGORI</th>
                <th>NOMOR</th>
                <th>TANGGAL</th>
                <th>FILE</th>
                <th>AKSI</th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.map(
                (document) => (
                  <tr
                    key={document.id}
                  >
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar">
                          PDF
                        </div>

                        <div>
                          <div className="member-name">
                            {document.judul}
                          </div>

                          <div className="member-secondary">
                            {document.keterangan ||
                              'Tidak ada keterangan'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-info">
                        {document.kategori}
                      </span>
                    </td>

                    <td>
                      {document.nomorDokumen ||
                        '-'}
                    </td>

                    <td>
                      {document.tanggal ||
                        '-'}
                    </td>

                    <td>
                      <div>
                        {document.fileName ||
                          '-'}
                      </div>

                      <div className="member-secondary">
                        {formatFileSize(
                          document.fileSize
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="member-actions">

                        <button
                          type="button"
                          className="action-btn action-view"
                          onClick={() =>
                            setSelectedDocument(
                              document
                            )
                          }
                        >
                          Lihat
                        </button>

                        <button
                          type="button"
                          className="action-btn action-edit"
                          onClick={() =>
                            handleEdit(
                              document
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="action-btn action-delete"
                          onClick={() =>
                            handleDelete(
                              document
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

          {filteredDocuments.length ===
            0 && (
            <div className="empty-search">
              {hasActiveFilter
                ? 'Tidak ada dokumen yang sesuai dengan filter.'
                : 'Belum ada dokumen AD / RT.'}
            </div>
          )}

        </div>

      </section>

      {showForm && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">
              <div>
                <h2>
                  {editingId !== null
                    ? 'Edit Dokumen AD / RT'
                    : 'Tambah Dokumen AD / RT'}
                </h2>

                <p>
                  File AD / RT harus
                  berupa PDF dengan
                  ukuran maksimal 5 MB.
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

                  <div className="form-group">
                    <label>
                      Judul Dokumen *
                    </label>

                    <input
                      type="text"
                      name="judul"
                      value={form.judul}
                      onChange={
                        handleChange
                      }
                      placeholder="Contoh: Anggaran Dasar Punguan Gultom"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Kategori *
                    </label>

                    <select
                      name="kategori"
                      value={
                        form.kategori
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="">
                        Pilih Kategori
                      </option>

                      {CATEGORY_OPTIONS.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Nomor Dokumen
                    </label>

                    <input
                      type="text"
                      name="nomorDokumen"
                      value={
                        form.nomorDokumen
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Nomor dokumen jika ada"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Tanggal
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

                  <div className="form-group form-group-full">
                    <label>
                      Keterangan
                    </label>

                    <textarea
                      name="keterangan"
                      value={
                        form.keterangan
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Masukkan keterangan dokumen"
                      rows={3}
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>
                      File PDF *
                    </label>

                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={
                        handleFileChange
                      }
                    />

                    {editingId !== null &&
                      !form.file && (
                        <small>
                          Kosongkan jika
                          tidak ingin
                          mengganti file.
                        </small>
                      )}

                    {form.file && (
                      <small>
                        {form.file.name}
                        {' - '}
                        {formatFileSize(
                          form.file.size
                        )}
                      </small>
                    )}
                  </div>

                </div>

              </div>

              <div className="modal-footer">

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
                  {editingId !== null
                    ? 'Simpan Perubahan'
                    : 'Simpan Dokumen'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {selectedDocument && (
        <div className="modal-overlay">

          <div className="modal detail-modal">

            <div className="modal-header">
              <div>
                <h2>
                  Detail Dokumen
                </h2>

                <p>
                  Informasi lengkap dokumen
                  AD / RT.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedDocument(
                    null
                  )
                }
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <div className="modal-body">

              <div className="detail-profile">

                <div className="detail-avatar">
                  PDF
                </div>

                <div>
                  <h3>
                    {
                      selectedDocument.judul
                    }
                  </h3>

                  <p>
                    {
                      selectedDocument.kategori
                    }
                  </p>
                </div>

              </div>

              <div className="detail-grid">

                <div className="detail-item">
                  <span>
                    Judul Dokumen
                  </span>

                  <strong>
                    {
                      selectedDocument.judul ||
                      '-'
                    }
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Kategori
                  </span>

                  <strong>
                    {
                      selectedDocument.kategori ||
                      '-'
                    }
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Nomor Dokumen
                  </span>

                  <strong>
                    {
                      selectedDocument.nomorDokumen ||
                      '-'
                    }
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Tanggal
                  </span>

                  <strong>
                    {
                      selectedDocument.tanggal ||
                      '-'
                    }
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Nama File
                  </span>

                  <strong>
                    {
                      selectedDocument.fileName ||
                      '-'
                    }
                  </strong>
                </div>

                <div className="detail-item">
                  <span>
                    Ukuran File
                  </span>

                  <strong>
                    {formatFileSize(
                      selectedDocument.fileSize
                    )}
                  </strong>
                </div>

                <div className="detail-item detail-item-full">
                  <span>
                    Keterangan
                  </span>

                  <strong>
                    {
                      selectedDocument.keterangan ||
                      '-'
                    }
                  </strong>
                </div>

              </div>

              {selectedDocument.fileData && (
                <div
                  style={{
                    marginTop: '24px',
                  }}
                >
                  <iframe
                    src={
                      selectedDocument.fileData
                    }
                    title={
                      selectedDocument.judul
                    }
                    style={{
                      width: '100%',
                      height: '500px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              )}

            </div>

            <div className="modal-footer">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setSelectedDocument(
                    null
                  )
                }
              >
                Tutup
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  handlePreview(
                    selectedDocument
                  )
                }
              >
                Buka PDF
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  handleDownload(
                    selectedDocument
                  )
                }
              >
                Download
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const document =
                    selectedDocument

                  setSelectedDocument(
                    null
                  )

                  handleEdit(
                    document
                  )
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

export default ADRT