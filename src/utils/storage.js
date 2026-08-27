// =========================================
// STORAGE UTILITIES
// Sistem Informasi Punguan Gultom
// =========================================

// =========================================
// STORAGE KEY - ANGGOTA
// =========================================

const MEMBERS_STORAGE_KEY = 'punguan_gultom_members'

// =========================================
// STORAGE KEY - KEGIATAN
// =========================================

const KEGIATAN_STORAGE_KEY = 'punguan_gultom_kegiatan'

// =========================================
// STORAGE KEY - AD/RT
// =========================================

const ADRT_STORAGE_KEY = 'punguan_gultom_adrt'

// =========================================
// STORAGE KEY - DOKUMEN PENTING
// =========================================

const DOKUMEN_PENTING_STORAGE_KEY =
  'punguan_gultom_dokumen_penting'

// =========================================
// HELPER STORAGE UMUM
// =========================================

function getArrayFromStorage(key, label) {
  try {
    const storedData = localStorage.getItem(key)

    if (!storedData) {
      return []
    }

    const parsedData = JSON.parse(storedData)

    if (!Array.isArray(parsedData)) {
      console.warn(
        `Data ${label} di localStorage bukan berupa array.`
      )

      return []
    }

    return parsedData
  } catch (error) {
    console.error(
      `Gagal membaca data ${label} dari localStorage:`,
      error
    )

    return []
  }
}

function saveArrayToStorage(key, data, functionName, label) {
  try {
    if (!Array.isArray(data)) {
      console.error(
        `${functionName}() membutuhkan data berupa array.`
      )

      return false
    }

    localStorage.setItem(key, JSON.stringify(data))

    return true
  } catch (error) {
    console.error(
      `Gagal menyimpan data ${label} ke localStorage:`,
      error
    )

    return false
  }
}

function clearStorage(key, functionName, label) {
  try {
    localStorage.removeItem(key)

    return true
  } catch (error) {
    console.error(
      `Gagal menghapus data ${label} melalui ${functionName}():`,
      error
    )

    return false
  }
}

// =========================================
// ANGGOTA
// =========================================

export function getMembers() {
  return getArrayFromStorage(
    MEMBERS_STORAGE_KEY,
    'anggota'
  )
}

export function saveMembers(members) {
  return saveArrayToStorage(
    MEMBERS_STORAGE_KEY,
    members,
    'saveMembers',
    'anggota'
  )
}

export function clearMembers() {
  return clearStorage(
    MEMBERS_STORAGE_KEY,
    'clearMembers',
    'anggota'
  )
}

export function hasMembers() {
  const members = getMembers()

  return members.length > 0
}

export function getMemberCount() {
  return getMembers().length
}

// =========================================
// KEGIATAN
// =========================================

export function getKegiatan() {
  return getArrayFromStorage(
    KEGIATAN_STORAGE_KEY,
    'kegiatan'
  )
}

export function saveKegiatan(kegiatan) {
  return saveArrayToStorage(
    KEGIATAN_STORAGE_KEY,
    kegiatan,
    'saveKegiatan',
    'kegiatan'
  )
}

export function clearKegiatan() {
  return clearStorage(
    KEGIATAN_STORAGE_KEY,
    'clearKegiatan',
    'kegiatan'
  )
}

export function hasKegiatan() {
  const kegiatan = getKegiatan()

  return kegiatan.length > 0
}

export function getKegiatanCount() {
  return getKegiatan().length
}

// =========================================
// AD / RT
// =========================================

export function getADRT() {
  return getArrayFromStorage(
    ADRT_STORAGE_KEY,
    'AD/RT'
  )
}

export function saveADRT(documents) {
  return saveArrayToStorage(
    ADRT_STORAGE_KEY,
    documents,
    'saveADRT',
    'AD/RT'
  )
}

export function clearADRT() {
  return clearStorage(
    ADRT_STORAGE_KEY,
    'clearADRT',
    'AD/RT'
  )
}

export function hasADRT() {
  const documents = getADRT()

  return documents.length > 0
}

export function getADRTCount() {
  return getADRT().length
}

// =========================================
// DOKUMEN PENTING
// =========================================

export function getDokumenPenting() {
  return getArrayFromStorage(
    DOKUMEN_PENTING_STORAGE_KEY,
    'dokumen penting'
  )
}

export function saveDokumenPenting(documents) {
  return saveArrayToStorage(
    DOKUMEN_PENTING_STORAGE_KEY,
    documents,
    'saveDokumenPenting',
    'dokumen penting'
  )
}

export function clearDokumenPenting() {
  return clearStorage(
    DOKUMEN_PENTING_STORAGE_KEY,
    'clearDokumenPenting',
    'dokumen penting'
  )
}

export function hasDokumenPenting() {
  const documents = getDokumenPenting()

  return documents.length > 0
}

export function getDokumenPentingCount() {
  return getDokumenPenting().length
}

// =========================================
// STORAGE KEY
// =========================================

export {
  MEMBERS_STORAGE_KEY,
  KEGIATAN_STORAGE_KEY,
  ADRT_STORAGE_KEY,
  DOKUMEN_PENTING_STORAGE_KEY,
}