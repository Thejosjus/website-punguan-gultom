// =========================================
// ADMIN PAGE
// Sistem Informasi Punguan Gultom
// =========================================
//
// Fungsi:
// - Menampilkan ringkasan data aplikasi
// - Reset seluruh data aplikasi
// - Konfirmasi keamanan RESET
// - Verifikasi hasil reset
// - Refresh dashboard setelah reset
//
// =========================================

import { useEffect, useState } from 'react'

import {
  getStorageSummary,
  getAllStorageData,
  clearAllStorage,
  verifyStorageReset,
} from '../utils/storage'


// =========================================
// HELPER
// =========================================

function getDataCount(data, key) {
  return Array.isArray(data?.[key])
    ? data[key].length
    : 0
}


function buildDataCount(data) {
  const members =
    getDataCount(data, 'members')

  const kegiatan =
    getDataCount(data, 'kegiatan')

  const koordinator =
    getDataCount(data, 'koordinator')

  const iuran =
    getDataCount(data, 'iuran')

  const adrt =
    getDataCount(data, 'adrt')

  const dokumenPenting =
    getDataCount(data, 'dokumenPenting')

  const total =
    members +
    kegiatan +
    koordinator +
    iuran +
    adrt +
    dokumenPenting

  return {
    members,
    kegiatan,
    koordinator,
    iuran,
    adrt,
    dokumenPenting,
    total,
  }
}


// =========================================
// INITIAL SUMMARY
// =========================================

function getInitialDataSummary() {
  return getStorageSummary()
}


// =========================================
// ADMIN COMPONENT
// =========================================

function Admin() {

  // =========================================
  // STATE
  // =========================================

  const [dataSummary, setDataSummary] =
    useState(getInitialDataSummary)

  const [showResetModal, setShowResetModal] =
    useState(false)

  const [resetText, setResetText] =
    useState('')

  const [isResetting, setIsResetting] =
    useState(false)

  const [resetResult, setResetResult] =
    useState(null)


  // =========================================
  // LOAD DATA SUMMARY
  // =========================================

  const loadDataSummary = () => {
    const summary = getStorageSummary()

    setDataSummary(summary)
  }


  // =========================================
  // STORAGE EVENT
  // =========================================
  //
  // Refresh otomatis ketika ada perubahan
  // data dari halaman/tab lain.
  // =========================================

  useEffect(() => {

    const handleStorageUpdated = () => {
      loadDataSummary()
    }


    const handleDataReset = () => {
      loadDataSummary()
    }


    window.addEventListener(
      'punguan-gultom-storage-updated',
      handleStorageUpdated
    )


    window.addEventListener(
      'punguan-gultom-data-reset',
      handleDataReset
    )


    return () => {

      window.removeEventListener(
        'punguan-gultom-storage-updated',
        handleStorageUpdated
      )


      window.removeEventListener(
        'punguan-gultom-data-reset',
        handleDataReset
      )
    }

  }, [])


  // =========================================
  // OPEN RESET MODAL
  // =========================================

  const openResetModal = () => {

    setResetText('')

    setResetResult(null)

    setShowResetModal(true)
  }


  // =========================================
  // CLOSE RESET MODAL
  // =========================================

  const closeResetModal = () => {

    if (isResetting) {
      return
    }


    setShowResetModal(false)

    setResetText('')

    setResetResult(null)
  }


  // =========================================
  // CHECK RESET TEXT
  // =========================================

  const isResetConfirmed =
    resetText.trim() === 'RESET'


  // =========================================
  // RESET ALL DATA
  // =========================================

  const handleResetAllData = () => {

    if (!isResetConfirmed) {
      return
    }


    if (isResetting) {
      return
    }


    // -----------------------------------------
    // START PROCESS
    // -----------------------------------------

    setIsResetting(true)

    setResetResult(null)


    try {

      // ---------------------------------------
      // SIMPAN JUMLAH DATA SEBELUM RESET
      // ---------------------------------------

      const beforeReset =
        getAllStorageData()


      const beforeCount =
        buildDataCount(beforeReset)


      const beforeTotal =
        beforeCount.total


      // ---------------------------------------
      // EKSEKUSI RESET
      // ---------------------------------------

      const resetOperation =
        clearAllStorage()


      // ---------------------------------------
      // CEK HASIL OPERASI RESET
      // ---------------------------------------

      if (
        !resetOperation ||
        resetOperation.success !== true
      ) {

        throw new Error(
          resetOperation?.message ||
          'Proses penghapusan data gagal.'
        )
      }


      // ---------------------------------------
      // VERIFIKASI RESET
      // ---------------------------------------

      const verification =
        verifyStorageReset()


      // ---------------------------------------
      // JIKA VERIFIKASI GAGAL
      // ---------------------------------------

      if (
        !verification ||
        verification.success !== true
      ) {

        const remainingKeys =
          verification?.remainingKeys || []


        setResetResult({

          success: false,

          beforeCount,

          beforeTotal,

          afterCount: null,

          remainingKeys,

          message:
            remainingKeys.length > 0
              ? `Reset tidak lengkap. Masih terdapat ${remainingKeys.length} storage key yang tersimpan.`
              : (
                  verification?.reason ||
                  'Reset gagal diverifikasi.'
                ),
        })


        loadDataSummary()

        return
      }


      // ---------------------------------------
      // BACA DATA SETELAH RESET
      // ---------------------------------------

      const afterReset =
        getAllStorageData()


      const afterCount =
        buildDataCount(afterReset)


      // ---------------------------------------
      // HITUNG DATA YANG MASIH TERSISA
      // ---------------------------------------

      const remainingData =
        afterCount.total


      // ---------------------------------------
      // VERIFIKASI FINAL
      // ---------------------------------------

      if (remainingData === 0) {

        // -------------------------------------
        // UPDATE SUMMARY
        // -------------------------------------

        setDataSummary({
          members: 0,
          kegiatan: 0,
          koordinator: 0,
          iuran: 0,
          adrt: 0,
          dokumenPenting: 0,
          total: 0,
        })


        // -------------------------------------
        // RESET RESULT
        // -------------------------------------

        setResetResult({

          success: true,

          beforeCount,

          beforeTotal,

          afterCount,

          remainingKeys: [],

          removedKeys:
            resetOperation.removedKeys || [],

          message:
            'Semua data berhasil dihapus dan telah diverifikasi.',
        })


        // -------------------------------------
        // EVENT UNTUK DASHBOARD
        // -------------------------------------

        window.dispatchEvent(
          new CustomEvent(
            'punguan-gultom-data-reset',
            {
              detail: {
                timestamp:
                  new Date().toISOString(),

                beforeCount,

                beforeTotal,

                afterCount,

                remainingData: 0,
              },
            }
          )
        )


        // -------------------------------------
        // STORAGE EVENT CUSTOM
        // -------------------------------------

        window.dispatchEvent(
          new Event(
            'punguan-gultom-storage-updated'
          )
        )


        // -------------------------------------
        // TUTUP MODAL SETELAH BERHASIL
        // -------------------------------------

        setTimeout(() => {

          setShowResetModal(false)

          setResetText('')

          setResetResult(null)

        }, 1200)

      } else {

        // -------------------------------------
        // RESET TIDAK LENGKAP
        // -------------------------------------

        setDataSummary(afterCount)


        setResetResult({

          success: false,

          beforeCount,

          beforeTotal,

          afterCount,

          remainingData,

          message:
            `Reset tidak lengkap. Masih terdapat ${remainingData} data.`,
        })
      }

    } catch (error) {

      // ---------------------------------------
      // ERROR HANDLER
      // ---------------------------------------

      console.error(
        'Reset semua data gagal:',
        error
      )


      setResetResult({

        success: false,

        message:
          error?.message ||
          'Terjadi kesalahan saat melakukan reset data.',
      })


      // ---------------------------------------
      // REFRESH SUMMARY
      // ---------------------------------------

      loadDataSummary()

    } finally {

      setIsResetting(false)

    }
  }


  // =========================================
  // DATA CARD
  // =========================================

  const summaryItems = [

    {
      label: 'Anggota',
      value: dataSummary.members,
      icon: '♟',
    },

    {
      label: 'Kegiatan',
      value: dataSummary.kegiatan,
      icon: '◷',
    },

    {
      label: 'Koordinator',
      value: dataSummary.koordinator,
      icon: '◆',
    },

    {
      label: 'Iuran',
      value: dataSummary.iuran,
      icon: '▤',
    },

    {
      label: 'AD / RT',
      value: dataSummary.adrt,
      icon: '▱',
    },

    {
      label: 'Dokumen Penting',
      value: dataSummary.dokumenPenting,
      icon: '▤',
    },

  ]


  // =========================================
  // RENDER
  // =========================================

  return (

    <div className="admin-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page-header">

        <div>

          <h1>
            Administrasi
          </h1>

          <p>
            Pengaturan dan pengelolaan sistem
            Punguan Gultom.
          </p>

        </div>

      </div>


      {/* =====================================
          WARNING
      ===================================== */}

      <div className="admin-warning">

        <div className="admin-warning-icon">
          ⚠️
        </div>

        <div>

          <h3>
            Area Administrator
          </h3>

          <p>
            Fitur pada halaman ini dapat
            memengaruhi seluruh data aplikasi.
            Pastikan tindakan yang dilakukan
            sudah benar sebelum melanjutkan.
          </p>

        </div>

      </div>


      {/* =====================================
          DATA SUMMARY
      ===================================== */}

      <section className="admin-section">

        <div className="section-header">

          <div>

            <h2>
              Ringkasan Data
            </h2>

            <p>
              Jumlah data yang tersimpan
              saat ini.
            </p>

          </div>


          <div className="total-data">

            <span>
              Total Data
            </span>

            <strong>
              {dataSummary.total}
            </strong>

          </div>

        </div>


        <div className="admin-summary-grid">

          {summaryItems.map((item) => (

            <div
              className="admin-summary-card"
              key={item.label}
            >

              <div className="summary-icon">
                {item.icon}
              </div>

              <div className="summary-content">

                <span>
                  {item.label}
                </span>

                <strong>
                  {item.value}
                </strong>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* =====================================
          DANGER ZONE
      ===================================== */}

      <section className="admin-section danger-zone">

        <div className="section-header">

          <div>

            <h2>
              Zona Berbahaya
            </h2>

            <p>
              Tindakan berikut akan menghapus
              seluruh data aplikasi.
            </p>

          </div>

        </div>


        <div className="danger-card">

          <div className="danger-info">

            <div className="danger-icon">
              🗑️
            </div>

            <div>

              <h3>
                Reset Semua Data
              </h3>

              <p>
                Menghapus seluruh data Anggota,
                Kegiatan, Koordinator Wilayah,
                Iuran Tahunan, AD/RT, dan
                Dokumen Penting dari localStorage.
              </p>

              <strong>
                Total data saat ini:{' '}
                {dataSummary.total}
              </strong>

            </div>

          </div>


          <button
            type="button"
            className="danger-button"
            onClick={openResetModal}
            disabled={
              dataSummary.total === 0 ||
              isResetting
            }
          >
            🗑️ Reset Semua Data
          </button>

        </div>

      </section>


      {/* =====================================
          RESET RESULT
      ===================================== */}

      {resetResult && (

        <div
          className={
            resetResult.success
              ? 'reset-result success'
              : 'reset-result error'
          }
        >

          <div className="reset-result-icon">

            {resetResult.success
              ? '✓'
              : '!'}

          </div>

          <div>

            <strong>

              {resetResult.success
                ? 'Reset Berhasil'
                : 'Reset Gagal'}

            </strong>

            <p>
              {resetResult.message}
            </p>

          </div>

        </div>

      )}


      {/* =====================================
          RESET MODAL
      ===================================== */}

      {showResetModal && (

        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >

          <div className="reset-modal">

            {/* ===============================
                MODAL HEADER
            =============================== */}

            <div className="reset-modal-header">

              <div className="reset-modal-icon">
                ⚠️
              </div>

              <div>

                <h2 id="reset-modal-title">
                  Reset Semua Data?
                </h2>

                <p>
                  Tindakan ini tidak dapat
                  dibatalkan.
                </p>

              </div>

            </div>


            {/* ===============================
                WARNING
            =============================== */}

            <div className="reset-modal-warning">

              <strong>
                PERINGATAN
              </strong>

              <p>
                Seluruh data aplikasi akan
                dihapus secara permanen dari
                penyimpanan browser ini.
              </p>

            </div>


            {/* ===============================
                SUMMARY
            =============================== */}

            <div className="reset-summary">

              <div className="reset-summary-title">
                Data yang akan dihapus:
              </div>


              <div className="reset-summary-grid">

                <div>

                  <span>
                    Anggota
                  </span>

                  <strong>
                    {dataSummary.members}
                  </strong>

                </div>


                <div>

                  <span>
                    Kegiatan
                  </span>

                  <strong>
                    {dataSummary.kegiatan}
                  </strong>

                </div>


                <div>

                  <span>
                    Koordinator
                  </span>

                  <strong>
                    {dataSummary.koordinator}
                  </strong>

                </div>


                <div>

                  <span>
                    Iuran
                  </span>

                  <strong>
                    {dataSummary.iuran}
                  </strong>

                </div>


                <div>

                  <span>
                    AD / RT
                  </span>

                  <strong>
                    {dataSummary.adrt}
                  </strong>

                </div>


                <div>

                  <span>
                    Dokumen
                  </span>

                  <strong>
                    {dataSummary.dokumenPenting}
                  </strong>

                </div>

              </div>


              <div className="reset-total">

                <span>
                  Total
                </span>

                <strong>
                  {dataSummary.total}
                </strong>

              </div>

            </div>


            {/* ===============================
                CONFIRMATION
            =============================== */}

            <div className="reset-confirm">

              <label htmlFor="reset-confirm-input">

                Untuk melanjutkan, ketik:

                <strong>
                  {' RESET'}
                </strong>

              </label>


              <input
                id="reset-confirm-input"
                type="text"
                value={resetText}
                onChange={(event) =>
                  setResetText(
                    event.target.value
                  )
                }
                placeholder="Ketik RESET"
                autoComplete="off"
                autoFocus
                disabled={isResetting}
              />


              {resetText.length > 0 &&
                !isResetConfirmed && (

                <small className="reset-input-error">

                  Teks konfirmasi harus sama
                  persis dengan RESET.

                </small>

              )}

            </div>


            {/* ===============================
                RESET RESULT INSIDE MODAL
            =============================== */}

            {resetResult && (

              <div
                className={
                  resetResult.success
                    ? 'modal-reset-result success'
                    : 'modal-reset-result error'
                }
              >

                {resetResult.success
                  ? '✓ '
                  : '⚠️ '}

                {resetResult.message}

              </div>

            )}


            {/* ===============================
                ACTION BUTTONS
            =============================== */}

            <div className="reset-modal-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={closeResetModal}
                disabled={isResetting}
              >
                Batal
              </button>


              <button
                type="button"
                className="confirm-reset-button"
                onClick={handleResetAllData}
                disabled={
                  !isResetConfirmed ||
                  isResetting
                }
              >

                {isResetting
                  ? '⏳ Menghapus Data...'
                  : '🗑️ Ya, Reset Semua Data'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}


export default Admin