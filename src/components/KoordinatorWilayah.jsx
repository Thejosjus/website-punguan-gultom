import { useEffect, useMemo, useState } from "react";

const KOORDINATOR_STORAGE_KEY = "punguan_gultom_koordinator_wilayah";
const ANGGOTA_STORAGE_KEY = "punguan_gultom_anggota";

const emptyForm = {
  wilayah: "",
  namaKoordinator: "",
  noHp: "",
  cakupanWilayah: "",
  keterangan: "",
};

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "KW";
  }

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[words.length - 1].charAt(0)
  ).toUpperCase();
}

function generateId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}

function readStorage(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return fallback;
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error(`Gagal membaca localStorage: ${key}`, error);
    return fallback;
  }
}

function normalizeWilayah(value = "") {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function KoordinatorWilayah() {
  const [koordinatorList, setKoordinatorList] = useState(() =>
    readStorage(KOORDINATOR_STORAGE_KEY)
  );

  const [anggotaList, setAnggotaList] = useState(() =>
    readStorage(ANGGOTA_STORAGE_KEY)
  );

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const [selectedCoordinator, setSelectedCoordinator] =
    useState(null);

  const [showDetail, setShowDetail] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /*
   * =========================================
   * REFRESH DATA ANGGOTA
   * =========================================
   *
   * Data anggota dibaca kembali ketika halaman
   * Koordinator Wilayah dibuka / digunakan.
   */

  useEffect(() => {
    const refreshAnggota = () => {
      setAnggotaList(
        readStorage(ANGGOTA_STORAGE_KEY)
      );
    };

    refreshAnggota();

    window.addEventListener(
      "storage",
      refreshAnggota
    );

    return () => {
      window.removeEventListener(
        "storage",
        refreshAnggota
      );
    };
  }, []);

  /*
   * =========================================
   * SIMPAN KOORDINATOR KE LOCAL STORAGE
   * =========================================
   */

  useEffect(() => {
    try {
      localStorage.setItem(
        KOORDINATOR_STORAGE_KEY,
        JSON.stringify(koordinatorList)
      );
    } catch (error) {
      console.error(
        "Gagal menyimpan koordinator wilayah:",
        error
      );
    }
  }, [koordinatorList]);

  /*
   * =========================================
   * JUMLAH ANGGOTA PER WILAYAH
   * =========================================
   */

  const getMemberCount = (wilayah) => {
    const target = normalizeWilayah(wilayah);

    if (!target) {
      return 0;
    }

    return anggotaList.filter((anggota) => {
      return (
        normalizeWilayah(anggota.wilayah) ===
        target
      );
    }).length;
  };

  /*
   * =========================================
   * DAFTAR ANGGOTA PER WILAYAH
   * =========================================
   */

  const getMembersByRegion = (wilayah) => {
    const target = normalizeWilayah(wilayah);

    if (!target) {
      return [];
    }

    return anggotaList.filter((anggota) => {
      return (
        normalizeWilayah(anggota.wilayah) ===
        target
      );
    });
  };

  /*
   * =========================================
   * SEARCH
   * =========================================
   */

  const filteredKoordinator = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return koordinatorList;
    }

    return koordinatorList.filter((item) => {
      return (
        item.wilayah
          ?.toLowerCase()
          .includes(keyword) ||
        item.namaKoordinator
          ?.toLowerCase()
          .includes(keyword) ||
        item.noHp
          ?.toLowerCase()
          .includes(keyword) ||
        item.cakupanWilayah
          ?.toLowerCase()
          .includes(keyword) ||
        item.keterangan
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [koordinatorList, search]);

  /*
   * =========================================
   * FORM INPUT
   * =========================================
   */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * =========================================
   * BUKA FORM TAMBAH
   * =========================================
   */

  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  /*
   * =========================================
   * BUKA FORM EDIT
   * =========================================
   */

  const handleEdit = (item) => {
    setEditingId(item.id);

    setFormData({
      wilayah: item.wilayah || "",
      namaKoordinator:
        item.namaKoordinator || "",
      noHp: item.noHp || "",
      cakupanWilayah:
        item.cakupanWilayah || "",
      keterangan:
        item.keterangan || "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * =========================================
   * BATAL FORM
   * =========================================
   */

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  /*
   * =========================================
   * SIMPAN FORM
   * =========================================
   */

  const handleSubmit = (event) => {
    event.preventDefault();

    const wilayah =
      formData.wilayah.trim();

    const namaKoordinator =
      formData.namaKoordinator.trim();

    const noHp =
      formData.noHp.trim();

    const cakupanWilayah =
      formData.cakupanWilayah.trim();

    const keterangan =
      formData.keterangan.trim();

    if (!wilayah) {
      alert("Nama wilayah wajib diisi.");
      return;
    }

    if (!namaKoordinator) {
      alert("Nama koordinator wajib diisi.");
      return;
    }

    /*
     * =========================================
     * CEK WILAYAH DUPLIKAT
     * =========================================
     */

    const duplicateWilayah =
      koordinatorList.some((item) => {
        const sameWilayah =
          normalizeWilayah(item.wilayah) ===
          normalizeWilayah(wilayah);

        const differentRecord =
          item.id !== editingId;

        return (
          sameWilayah &&
          differentRecord
        );
      });

    if (duplicateWilayah) {
      alert(
        "Wilayah tersebut sudah memiliki koordinator. Silakan gunakan nama wilayah lain atau edit data yang sudah ada."
      );
      return;
    }

    /*
     * =========================================
     * MODE EDIT
     * =========================================
     */

    if (editingId) {
      setKoordinatorList((previous) =>
        previous.map((item) => {
          if (item.id !== editingId) {
            return item;
          }

          return {
            ...item,
            wilayah,
            namaKoordinator,
            noHp,
            cakupanWilayah,
            keterangan,
            updatedAt:
              new Date().toISOString(),
          };
        })
      );

      alert(
        "Data koordinator berhasil diperbarui."
      );
    }

    /*
     * =========================================
     * MODE TAMBAH
     * =========================================
     */

    else {
      const newCoordinator = {
        id: generateId(),
        wilayah,
        namaKoordinator,
        noHp,
        cakupanWilayah,
        keterangan,
        createdAt:
          new Date().toISOString(),
        updatedAt:
          new Date().toISOString(),
      };

      setKoordinatorList((previous) => [
        ...previous,
        newCoordinator,
      ]);

      alert(
        "Koordinator wilayah berhasil ditambahkan."
      );
    }

    handleCancel();
  };

  /*
   * =========================================
   * HAPUS
   * =========================================
   */

  const handleDelete = (item) => {
    setDeleteTarget(item);
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    setKoordinatorList((previous) =>
      previous.filter(
        (item) =>
          item.id !== deleteTarget.id
      )
    );

    if (
      selectedCoordinator?.id ===
      deleteTarget.id
    ) {
      setSelectedCoordinator(null);
      setShowDetail(false);
    }

    alert(
      "Data koordinator berhasil dihapus."
    );

    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  /*
   * =========================================
   * DETAIL
   * =========================================
   */

  const handleDetail = (item) => {
    setSelectedCoordinator(item);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setSelectedCoordinator(null);
    setShowDetail(false);
  };

  /*
   * =========================================
   * STATISTIK
   * =========================================
   */

  const totalKoordinator =
    koordinatorList.length;

  const totalAnggotaTercover =
    koordinatorList.reduce(
      (total, item) =>
        total + getMemberCount(item.wilayah),
      0
    );

  return (
    <div className="anggota-page">

      {/* =========================================
          PAGE HEADER
      ========================================= */}

      <div className="content-header">

        <div>
          <h1>
            Koordinator Wilayah
          </h1>

          <p>
            Kelola koordinator dan cakupan wilayah
            Punguan Gultom.
          </p>
        </div>

        <div className="header-actions">

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAdd}
          >
            + Tambah Koordinator
          </button>

        </div>

      </div>


      {/* =========================================
          STATISTIK
      ========================================= */}

      <section className="stats-grid">

        <div className="stat-card stat-members">

          <div className="stat-top">

            <div className="stat-label">
              Total Koordinator
            </div>

            <div className="stat-icon">
              ◆
            </div>

          </div>

          <div className="stat-value">
            {totalKoordinator}
          </div>

          <div className="stat-change success-text">
            Koordinator wilayah terdaftar
          </div>

        </div>


        <div className="stat-card stat-balance">

          <div className="stat-top">

            <div className="stat-label">
              Anggota Tercover
            </div>

            <div className="stat-icon">
              ♟
            </div>

          </div>

          <div className="stat-value">
            {totalAnggotaTercover}
          </div>

          <div className="stat-change success-text">
            Berdasarkan wilayah anggota
          </div>

        </div>


        <div className="stat-card stat-income">

          <div className="stat-top">

            <div className="stat-label">
              Wilayah Terdaftar
            </div>

            <div className="stat-icon">
              ✓
            </div>

          </div>

          <div className="stat-value">
            {totalKoordinator}
          </div>

          <div className="stat-change success-text">
            Data wilayah aktif
          </div>

        </div>


        <div className="stat-card stat-expense">

          <div className="stat-top">

            <div className="stat-label">
              Belum Terisi
            </div>

            <div className="stat-icon">
              !
            </div>

          </div>

          <div className="stat-value">
            {koordinatorList.filter(
              (item) =>
                getMemberCount(
                  item.wilayah
                ) === 0
            ).length}
          </div>

          <div className="stat-change warning-text">
            Belum memiliki anggota
          </div>

        </div>

      </section>


      {/* =========================================
          FORM TAMBAH / EDIT
      ========================================= */}

      {showForm && (

        <section
          className="card"
          style={{
            marginBottom: "18px",
          }}
        >

          <div className="card-header">

            <div>

              <h3 className="card-title">
                {editingId
                  ? "Edit Koordinator Wilayah"
                  : "Tambah Koordinator Wilayah"}
              </h3>

              <div className="card-subtitle">
                Masukkan informasi koordinator dan
                cakupan wilayah secara manual.
              </div>

            </div>

          </div>


          <form
            onSubmit={handleSubmit}
            style={{
              padding: "20px",
            }}
          >

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >

              {/* WILAYAH */}

              <div className="form-group">

                <label className="form-label">
                  Nama Wilayah
                  <span className="required">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="wilayah"
                  value={formData.wilayah}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Contoh: Lampung Selatan"
                  required
                />

              </div>


              {/* KOORDINATOR */}

              <div className="form-group">

                <label className="form-label">
                  Nama Koordinator
                  <span className="required">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="namaKoordinator"
                  value={
                    formData.namaKoordinator
                  }
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Nama lengkap koordinator"
                  required
                />

              </div>


              {/* NO HP */}

              <div className="form-group">

                <label className="form-label">
                  No. HP
                </label>

                <input
                  type="tel"
                  name="noHp"
                  value={formData.noHp}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="08xxxxxxxxxx"
                />

              </div>


              {/* CAKUPAN */}

              <div className="form-group">

                <label className="form-label">
                  Cakupan Wilayah
                </label>

                <textarea
                  name="cakupanWilayah"
                  value={
                    formData.cakupanWilayah
                  }
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  placeholder="Contoh: Kalianda, Natar, Sidomulyo, Katibung, Bakauheni"
                  rows="3"
                />

                <div className="form-help">
                  Isi secara manual sesuai cakupan
                  koordinator.
                </div>

              </div>


              {/* KETERANGAN */}

              <div
                className="form-group"
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >

                <label className="form-label">
                  Keterangan
                </label>

                <textarea
                  name="keterangan"
                  value={
                    formData.keterangan
                  }
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  placeholder="Keterangan tambahan..."
                  rows="3"
                />

              </div>

            </div>


            {/* FORM ACTION */}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "9px",
                marginTop: "20px",
                paddingTop: "18px",
                borderTop:
                  "1px solid #edf0f4",
              }}
            >

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Batal
              </button>

              <button
                type="submit"
                className="btn btn-primary"
              >
                {editingId
                  ? "Simpan Perubahan"
                  : "Simpan Koordinator"}
              </button>

            </div>

          </form>

        </section>

      )}


      {/* =========================================
          DAFTAR KOORDINATOR
      ========================================= */}

      <section className="card">

        <div className="card-header">

          <div>

            <h3 className="card-title">
              Daftar Koordinator Wilayah
            </h3>

            <div className="card-subtitle">
              {filteredKoordinator.length} data
              ditampilkan
            </div>

          </div>


          <div className="search-box">

            <input
              type="text"
              placeholder="Cari wilayah / koordinator..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

        </div>


        {/* =========================================
            TABLE
        ========================================= */}

        <div className="table-wrapper">

          <table className="data-table">

            <thead>

              <tr>

                <th>
                  WILAYAH
                </th>

                <th>
                  KOORDINATOR
                </th>

                <th>
                  NO. HP
                </th>

                <th>
                  JUMLAH ANGGOTA
                </th>

                <th>
                  CAKUPAN WILAYAH
                </th>

                <th>
                  AKSI
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredKoordinator.map(
                (item) => {

                  const memberCount =
                    getMemberCount(
                      item.wilayah
                    );

                  return (

                    <tr
                      key={item.id}
                    >

                      {/* WILAYAH */}

                      <td>

                        <div
                          className="member-cell"
                        >

                          <div
                            className="member-avatar"
                          >
                            {getInitials(
                              item.wilayah
                            )}
                          </div>

                          <span
                            className="member-name"
                          >
                            {item.wilayah}
                          </span>

                        </div>

                      </td>


                      {/* KOORDINATOR */}

                      <td>

                        <div
                          style={{
                            fontWeight: 700,
                            color:
                              "#173a5f",
                          }}
                        >
                          {
                            item.namaKoordinator
                          }
                        </div>

                      </td>


                      {/* PHONE */}

                      <td>
                        {item.noHp || "-"}
                      </td>


                      {/* MEMBER COUNT */}

                      <td>

                        <span
                          className={
                            memberCount > 0
                              ? "badge badge-success"
                              : "badge badge-warning"
                          }
                        >
                          {memberCount} anggota
                        </span>

                      </td>


                      {/* CAKUPAN */}

                      <td>

                        <div
                          style={{
                            maxWidth:
                              "280px",
                            whiteSpace:
                              "normal",
                            lineHeight:
                              "1.5",
                          }}
                        >
                          {item.cakupanWilayah ||
                            "-"}

                        </div>

                      </td>


                      {/* ACTION */}

                      <td>

                        <div
                          style={{
                            display:
                              "flex",
                            gap: "6px",
                            alignItems:
                              "center",
                          }}
                        >

                          <button
                            type="button"
                            className="action-btn action-detail"
                            onClick={() =>
                              handleDetail(
                                item
                              )
                            }
                            title="Detail"
                          >
                            Detail
                          </button>

                          <button
                            type="button"
                            className="action-btn action-edit"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            title="Edit"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="action-btn action-delete"
                            onClick={() =>
                              handleDelete(
                                item
                              )
                            }
                            title="Hapus"
                          >
                            Hapus
                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                }
              )}

            </tbody>

          </table>


          {/* EMPTY */}

          {filteredKoordinator.length ===
            0 && (

            <div className="empty-search">

              {search
                ? "Koordinator atau wilayah tidak ditemukan."
                : "Belum ada data koordinator wilayah."}

            </div>

          )}

        </div>

      </section>


      {/* =========================================
          DETAIL MODAL
      ========================================= */}

      {showDetail &&
        selectedCoordinator && (

          <div className="modal-overlay">

            <div className="modal-card">

              <div className="modal-header">

                <div>

                  <h3>
                    Detail Koordinator
                  </h3>

                  <p>
                    Informasi wilayah dan
                    cakupan koordinator.
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={closeDetail}
                >
                  ×
                </button>

              </div>


              <div className="modal-body">

                <div className="detail-profile">

                  <div className="detail-avatar">

                    {getInitials(
                      selectedCoordinator.namaKoordinator
                    )}

                  </div>

                  <div>

                    <div className="detail-name">
                      {
                        selectedCoordinator.namaKoordinator
                      }
                    </div>

                    <div className="detail-region">
                      {
                        selectedCoordinator.wilayah
                      }
                    </div>

                  </div>

                </div>


                <div className="detail-grid">

                  <div className="detail-item">

                    <div className="detail-label">
                      No. HP
                    </div>

                    <div className="detail-value">
                      {
                        selectedCoordinator.noHp ||
                        "-"
                      }
                    </div>

                  </div>


                  <div className="detail-item">

                    <div className="detail-label">
                      Jumlah Anggota
                    </div>

                    <div className="detail-value">
                      {
                        getMemberCount(
                          selectedCoordinator.wilayah
                        )
                      }{" "}
                      anggota
                    </div>

                  </div>


                  <div
                    className="detail-item detail-full"
                  >

                    <div className="detail-label">
                      Cakupan Wilayah
                    </div>

                    <div className="detail-value detail-description">
                      {
                        selectedCoordinator.cakupanWilayah ||
                        "-"
                      }
                    </div>

                  </div>


                  <div
                    className="detail-item detail-full"
                  >

                    <div className="detail-label">
                      Keterangan
                    </div>

                    <div className="detail-value detail-description">
                      {
                        selectedCoordinator.keterangan ||
                        "-"
                      }
                    </div>

                  </div>

                </div>


                {/* ANGGOTA DI WILAYAH */}

                <div
                  className="detail-member-section"
                >

                  <div
                    className="detail-section-title"
                  >
                    Anggota di Wilayah Ini
                  </div>


                  {getMembersByRegion(
                    selectedCoordinator.wilayah
                  ).length === 0 ? (

                    <div className="detail-empty">
                      Belum ada anggota yang
                      terdaftar pada wilayah ini.
                    </div>

                  ) : (

                    <div className="detail-member-list">

                      {getMembersByRegion(
                        selectedCoordinator.wilayah
                      ).map(
                        (anggota, index) => (

                          <div
                            className="detail-member-row"
                            key={
                              anggota.id ||
                              anggota.namaSuami ||
                              index
                            }
                          >

                            <div className="member-avatar">
                              {getInitials(
                                anggota.namaSuami ||
                                anggota.nama ||
                                "Anggota"
                              )}
                            </div>

                            <div>

                              <div className="detail-member-name">
                                {
                                  anggota.namaSuami ||
                                  anggota.nama ||
                                  "Nama tidak tersedia"
                                }
                              </div>

                              <div className="detail-member-info">

                                {anggota.namaIstri
                                  ? `Istri: ${anggota.namaIstri}`
                                  : ""}

                                {anggota.status
                                  ? ` • ${anggota.status}`
                                  : ""}

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

              </div>


              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDetail}
                >
                  Tutup
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    closeDetail();
                    handleEdit(
                      selectedCoordinator
                    );
                  }}
                >
                  Edit Data
                </button>

              </div>

            </div>

          </div>

        )}


      {/* =========================================
          DELETE CONFIRMATION
      ========================================= */}

      {deleteTarget && (

        <div className="modal-overlay">

          <div
            className="modal-card delete-modal"
          >

            <div className="delete-icon">
              !
            </div>

            <h3>
              Hapus Koordinator?
            </h3>

            <p>
              Anda yakin ingin menghapus
              koordinator{" "}
              <strong>
                {deleteTarget.namaKoordinator}
              </strong>{" "}
              untuk wilayah{" "}
              <strong>
                {deleteTarget.wilayah}
              </strong>
              ?
            </p>

            <div className="modal-footer">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelDelete}
              >
                Batal
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                Ya, Hapus
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default KoordinatorWilayah;


/* =====================================================
   LOCAL STYLES
===================================================== */

const style = document.createElement("style");

style.innerHTML = `

/* =========================================
   FORM
========================================= */

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 7px;
  color: #344054;
  font-size: 10px;
  font-weight: 700;
}

.required {
  margin-left: 3px;
  color: #f04438;
}

.form-input {
  width: 100%;
  min-height: 38px;
  padding: 9px 11px;
  border: 1px solid #dce2eb;
  border-radius: 8px;
  background: #ffffff;
  color: #344054;
  font-size: 10px;
  outline: none;
  resize: vertical;
  transition: all 0.2s ease;
}

.form-input::placeholder {
  color: #98a2b3;
}

.form-input:focus {
  border-color: #84adff;
  box-shadow:
    0 0 0 3px rgba(37, 99, 235, 0.08);
}

.form-textarea {
  min-height: 80px;
  line-height: 1.5;
}

.form-help {
  margin-top: 5px;
  color: #98a2b3;
  font-size: 8px;
}


/* =========================================
   ACTION BUTTON
========================================= */

.action-btn {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 8px;
  background: #ffffff;
  font-size: 8px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.action-detail {
  color: #2563eb;
  border-color: #d7e4ff;
  background: #f5f8ff;
}

.action-detail:hover {
  background: #eaf1ff;
}

.action-edit {
  color: #667085;
  border-color: #dce2eb;
}

.action-edit:hover {
  color: #2563eb;
  border-color: #b9d0ff;
  background: #f5f8ff;
}

.action-delete {
  color: #d92d20;
  border-color: #f3c4c0;
  background: #fff8f7;
}

.action-delete:hover {
  background: #ffefed;
}


/* =========================================
   MODAL
========================================= */

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

.modal-card {
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 14px;
  box-shadow:
    0 20px 50px rgba(16, 24, 40, 0.18);
}

.modal-header {
  min-height: 70px;
  padding: 18px 20px;
  border-bottom: 1px solid #edf0f4;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
}

.modal-header h3 {
  margin: 0;
  color: #173a5f;
  font-size: 15px;
  font-weight: 800;
}

.modal-header p {
  margin: 5px 0 0;
  color: #98a2b3;
  font-size: 9px;
}

.modal-close {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 7px;
  background: #f5f7fa;
  color: #667085;
  font-size: 20px;
  line-height: 1;
}

.modal-close:hover {
  background: #eef1f5;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #edf0f4;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}


/* =========================================
   DETAIL PROFILE
========================================= */

.detail-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #edf0f4;
}

.detail-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e2edff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
}

.detail-name {
  color: #173a5f;
  font-size: 13px;
  font-weight: 800;
}

.detail-region {
  margin-top: 4px;
  color: #8292a5;
  font-size: 9px;
}


/* =========================================
   DETAIL GRID
========================================= */

.detail-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  padding: 12px;
  border: 1px solid #edf0f4;
  border-radius: 9px;
  background: #fafbfc;
}

.detail-full {
  grid-column: 1 / -1;
}

.detail-label {
  color: #98a2b3;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.detail-value {
  margin-top: 5px;
  color: #344054;
  font-size: 10px;
  font-weight: 600;
}

.detail-description {
  line-height: 1.6;
  white-space: pre-wrap;
}


/* =========================================
   DETAIL MEMBER
========================================= */

.detail-member-section {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #edf0f4;
}

.detail-section-title {
  margin-bottom: 10px;
  color: #173a5f;
  font-size: 11px;
  font-weight: 800;
}

.detail-empty {
  padding: 15px;
  border-radius: 8px;
  background: #f8fafc;
  color: #98a2b3;
  font-size: 9px;
  text-align: center;
}

.detail-member-list {
  max-height: 220px;
  overflow-y: auto;
}

.detail-member-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 0;
  border-bottom: 1px solid #f0f2f5;
}

.detail-member-row:last-child {
  border-bottom: 0;
}

.detail-member-name {
  color: #344054;
  font-size: 9px;
  font-weight: 700;
}

.detail-member-info {
  margin-top: 3px;
  color: #98a2b3;
  font-size: 8px;
}


/* =========================================
   DELETE MODAL
========================================= */

.delete-modal {
  max-width: 420px;
  padding: 30px;
  text-align: center;
}

.delete-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #fff0ef;
  color: #f04438;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
}

.delete-modal h3 {
  margin: 0;
  color: #173a5f;
  font-size: 16px;
  font-weight: 800;
}

.delete-modal p {
  margin: 10px 0 20px;
  color: #667085;
  font-size: 10px;
  line-height: 1.6;
}

.delete-modal .modal-footer {
  padding: 15px 0 0;
  border-top: 0;
  justify-content: center;
}


/* =========================================
   DANGER BUTTON
========================================= */

.btn-danger {
  color: #ffffff;
  background: #d92d20;
  border: 1px solid #d92d20;
}

.btn-danger:hover {
  background: #b42318;
  border-color: #b42318;
}


/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 768px) {

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-full {
    grid-column: auto;
  }

}

@media (max-width: 600px) {

  .modal-overlay {
    padding: 10px;
  }

  .modal-card {
    max-height: 94vh;
  }

  .modal-body {
    padding: 15px;
  }

}

`;

document.head.appendChild(style);