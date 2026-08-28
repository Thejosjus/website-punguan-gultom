// =========================================
// STORAGE UTILITY
// Sistem Informasi Punguan Gultom
// =========================================
//
// Semua data aplikasi disimpan di localStorage.
//
// STORAGE:
// 1. Anggota
// 2. Kegiatan
// 3. Koordinator Wilayah
// 4. Iuran Tahunan
// 5. AD/ART
// 6. Dokumen Penting
//
// Catatan:
// - Tidak menggunakan localStorage.clear()
// - Storage key lama dipertahankan
// - Mendukung kompatibilitas id dan _id
// - Menangani JSON/storage error
// - Menyediakan CRUD helper
// - Mendukung storage event antar-tab
// =========================================


// =========================================
// STORAGE KEYS
// =========================================

// JANGAN UBAH KEY INI
// karena kemungkinan sudah digunakan oleh
// data yang tersimpan sebelumnya.

export const MEMBERS_STORAGE_KEY =
  'punguan_gultom_members'

export const KEGIATAN_STORAGE_KEY =
  'punguan_gultom_kegiatan'

export const KOORDINATOR_STORAGE_KEY =
  'punguan_gultom_koordinator'

export const IURAN_STORAGE_KEY =
  'punguan_gultom_iuran'

export const ADRT_STORAGE_KEY =
  'punguan_gultom_adrt'

export const DOKUMEN_PENTING_STORAGE_KEY =
  'punguan_gultom_dokumen_penting'


// =========================================
// APPLICATION STORAGE KEYS
// =========================================
//
// HANYA key di bawah ini yang boleh dihapus
// oleh fitur "Reset Semua Data".
//
// JANGAN menggunakan:
// localStorage.clear()
//
// agar storage lain tidak ikut terhapus.
// =========================================

export const APPLICATION_STORAGE_KEYS = [
  MEMBERS_STORAGE_KEY,
  KEGIATAN_STORAGE_KEY,
  KOORDINATOR_STORAGE_KEY,
  IURAN_STORAGE_KEY,
  ADRT_STORAGE_KEY,
  DOKUMEN_PENTING_STORAGE_KEY,
]


// =========================================
// ENVIRONMENT CHECK
// =========================================

function isBrowserStorageAvailable() {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    )
  } catch {
    return false
  }
}


// =========================================
// GENERATE ID
// =========================================

function generateId(prefix = 'item') {

  // Browser modern
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}-${crypto.randomUUID()}`
  }


  // Fallback browser lama
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 11)}`
}


// =========================================
// NORMALIZE ID
// =========================================
//
// Memastikan data lama yang menggunakan _id
// tetap dapat digunakan.
//
// Prioritas:
// 1. id
// 2. _id
// 3. generate ID baru
// =========================================

function normalizeId(
  item,
  prefix = 'item'
) {

  if (!item || typeof item !== 'object') {
    return generateId(prefix)
  }


  if (
    item.id !== undefined &&
    item.id !== null &&
    String(item.id).trim() !== ''
  ) {
    return String(item.id)
  }


  if (
    item._id !== undefined &&
    item._id !== null &&
    String(item._id).trim() !== ''
  ) {
    return String(item._id)
  }


  return generateId(prefix)
}


// =========================================
// SAFE PARSE
// =========================================

function parseStorage(
  key,
  defaultValue = []
) {

  if (!isBrowserStorageAvailable()) {
    return defaultValue
  }


  try {

    const raw =
      localStorage.getItem(key)


    if (
      raw === null ||
      raw === ''
    ) {
      return defaultValue
    }


    const parsed =
      JSON.parse(raw)


    if (!Array.isArray(parsed)) {

      console.warn(
        `Data localStorage bukan array: ${key}`
      )

      return defaultValue
    }


    return parsed

  } catch (error) {

    console.error(
      `Gagal membaca localStorage: ${key}`,
      error
    )

    return defaultValue
  }
}


// =========================================
// SAFE SAVE
// =========================================

function saveStorage(
  key,
  data
) {

  if (!isBrowserStorageAvailable()) {

    console.error(
      'localStorage tidak tersedia.'
    )

    return false
  }


  if (!Array.isArray(data)) {

    console.error(
      `Data yang disimpan harus berupa array: ${key}`
    )

    return false
  }


  try {

    const serializedData =
      JSON.stringify(data)


    localStorage.setItem(
      key,
      serializedData
    )


    return true

  } catch (error) {

    console.error(
      `Gagal menyimpan localStorage: ${key}`,
      error
    )


    if (
      error?.name === 'QuotaExceededError'
    ) {

      console.error(
        'Kapasitas localStorage sudah penuh.'
      )
    }


    return false
  }
}


// =========================================
// GENERIC STORAGE HELPERS
// =========================================

function getItems(key) {
  return parseStorage(key, [])
}


function saveItems(
  key,
  items
) {
  return saveStorage(key, items)
}


// =========================================
// ADD ITEM
// =========================================

function addItem(
  key,
  item,
  prefix = 'item'
) {

  const items =
    getItems(key)


  const safeItem =
    item &&
    typeof item === 'object'
      ? item
      : {}


  const now =
    new Date().toISOString()


  const newItem = {

    ...safeItem,

    id: normalizeId(
      safeItem,
      prefix
    ),

    createdAt:
      safeItem.createdAt ??
      now,

    updatedAt: now,
  }


  items.push(newItem)


  const saved =
    saveStorage(
      key,
      items
    )


  if (!saved) {
    return null
  }


  return newItem
}


// =========================================
// UPDATE ITEM
// =========================================

function updateItem(
  key,
  id,
  updatedData
) {

  const items =
    getItems(key)


  const normalizedId =
    String(id)


  const index =
    items.findIndex(
      (item) => {

        if (!item) {
          return false
        }


        const itemId =
          normalizeId(
            item,
            'item'
          )


        return (
          String(itemId) ===
          normalizedId
        )
      }
    )


  if (index === -1) {
    return null
  }


  const currentItem =
    items[index] || {}


  const safeUpdatedData =
    updatedData &&
    typeof updatedData === 'object'
      ? updatedData
      : {}


  const updatedItem = {

    ...currentItem,

    ...safeUpdatedData,

    // Selalu gunakan id standar
    id: normalizeId(
      currentItem,
      'item'
    ),

    updatedAt:
      new Date().toISOString(),
  }


  // Hilangkan _id jika merupakan duplikat
  // dari id standar.
  if (
    updatedItem._id !== undefined &&
    String(updatedItem._id) ===
      String(updatedItem.id)
  ) {

    delete updatedItem._id
  }


  items[index] =
    updatedItem


  const saved =
    saveStorage(
      key,
      items
    )


  if (!saved) {
    return null
  }


  return updatedItem
}


// =========================================
// DELETE ITEM
// =========================================

function deleteItem(
  key,
  id
) {

  const items =
    getItems(key)


  const normalizedId =
    String(id)


  const index =
    items.findIndex(
      (item) => {

        if (!item) {
          return false
        }


        const itemId =
          normalizeId(
            item,
            'item'
          )


        return (
          String(itemId) ===
          normalizedId
        )
      }
    )


  // ID tidak ditemukan
  if (index === -1) {
    return false
  }


  const filtered =
    items.filter(
      (_, itemIndex) =>
        itemIndex !== index
    )


  return saveStorage(
    key,
    filtered
  )
}


// =========================================
// CLEAR ITEMS
// =========================================

function clearItems(key) {

  if (!isBrowserStorageAvailable()) {
    return false
  }


  try {

    const existed =
      localStorage.getItem(key) !== null


    if (!existed) {
      return true
    }


    localStorage.removeItem(key)


    return true

  } catch (error) {

    console.error(
      `Gagal menghapus localStorage: ${key}`,
      error
    )


    return false
  }
}


// =========================================
// ANGGOTA
// =========================================

export function getMembers() {
  return getItems(
    MEMBERS_STORAGE_KEY
  )
}


export function saveMembers(
  members
) {

  return saveItems(
    MEMBERS_STORAGE_KEY,
    Array.isArray(members)
      ? members
      : []
  )
}


export function addMember(
  member
) {

  return addItem(
    MEMBERS_STORAGE_KEY,
    member,
    'member'
  )
}


export function updateMember(
  id,
  updatedData
) {

  return updateItem(
    MEMBERS_STORAGE_KEY,
    id,
    updatedData
  )
}


export function deleteMember(
  id
) {

  return deleteItem(
    MEMBERS_STORAGE_KEY,
    id
  )
}


export function clearMembers() {
  return clearItems(
    MEMBERS_STORAGE_KEY
  )
}


export function hasMembers() {
  return getMembers().length > 0
}


export function countMembers() {
  return getMembers().length
}


// =========================================
// KEGIATAN
// =========================================

export function getKegiatan() {
  return getItems(
    KEGIATAN_STORAGE_KEY
  )
}


export function saveKegiatan(
  kegiatan
) {

  return saveItems(
    KEGIATAN_STORAGE_KEY,
    Array.isArray(kegiatan)
      ? kegiatan
      : []
  )
}


export function addKegiatan(
  kegiatan
) {

  return addItem(
    KEGIATAN_STORAGE_KEY,
    kegiatan,
    'kegiatan'
  )
}


export function updateKegiatan(
  id,
  updatedData
) {

  return updateItem(
    KEGIATAN_STORAGE_KEY,
    id,
    updatedData
  )
}


export function deleteKegiatan(
  id
) {

  return deleteItem(
    KEGIATAN_STORAGE_KEY,
    id
  )
}


export function clearKegiatan() {
  return clearItems(
    KEGIATAN_STORAGE_KEY
  )
}


export function hasKegiatan() {
  return getKegiatan().length > 0
}


export function countKegiatan() {
  return getKegiatan().length
}


// =========================================
// KOORDINATOR WILAYAH
// =========================================

export function getKoordinator() {
  return getItems(
    KOORDINATOR_STORAGE_KEY
  )
}


export function saveKoordinator(
  koordinator
) {

  return saveItems(
    KOORDINATOR_STORAGE_KEY,
    Array.isArray(koordinator)
      ? koordinator
      : []
  )
}


export function addKoordinator(
  koordinator
) {

  return addItem(
    KOORDINATOR_STORAGE_KEY,
    koordinator,
    'koordinator'
  )
}


export function updateKoordinator(
  id,
  updatedData
) {

  return updateItem(
    KOORDINATOR_STORAGE_KEY,
    id,
    updatedData
  )
}


export function deleteKoordinator(
  id
) {

  return deleteItem(
    KOORDINATOR_STORAGE_KEY,
    id
  )
}


export function clearKoordinator() {
  return clearItems(
    KOORDINATOR_STORAGE_KEY
  )
}


export function hasKoordinator() {
  return getKoordinator().length > 0
}


export function countKoordinator() {
  return getKoordinator().length
}


// =========================================
// IURAN
// =========================================

export function getIuran() {
  return getItems(
    IURAN_STORAGE_KEY
  )
}


export function saveIuran(
  iuran
) {

  return saveItems(
    IURAN_STORAGE_KEY,
    Array.isArray(iuran)
      ? iuran
      : []
  )
}


export function addIuran(
  iuran
) {

  return addItem(
    IURAN_STORAGE_KEY,
    iuran,
    'iuran'
  )
}


export function updateIuran(
  id,
  updatedData
) {

  return updateItem(
    IURAN_STORAGE_KEY,
    id,
    updatedData
  )
}


export function deleteIuran(
  id
) {

  return deleteItem(
    IURAN_STORAGE_KEY,
    id
  )
}


export function clearIuran() {
  return clearItems(
    IURAN_STORAGE_KEY
  )
}


export function hasIuran() {
  return getIuran().length > 0
}


export function countIuran() {
  return getIuran().length
}


// =========================================
// AD / ART
// =========================================

export function getADRT() {
  return getItems(
    ADRT_STORAGE_KEY
  )
}


export function saveADRT(
  adrt
) {

  return saveItems(
    ADRT_STORAGE_KEY,
    Array.isArray(adrt)
      ? adrt
      : []
  )
}


export function addADRT(
  adrt
) {

  return addItem(
    ADRT_STORAGE_KEY,
    adrt,
    'adrt'
  )
}


export function updateADRT(
  id,
  updatedData
) {

  return updateItem(
    ADRT_STORAGE_KEY,
    id,
    updatedData
  )
}


export function deleteADRT(
  id
) {

  return deleteItem(
    ADRT_STORAGE_KEY,
    id
  )
}


export function clearADRT() {
  return clearItems(
    ADRT_STORAGE_KEY
  )
}


export function hasADRT() {
  return getADRT().length > 0
}


export function countADRT() {
  return getADRT().length
}


// =========================================
// DOKUMEN PENTING
// =========================================

export function getDokumenPenting() {
  return getItems(
    DOKUMEN_PENTING_STORAGE_KEY
  )
}


export function saveDokumenPenting(
  dokumen
) {

  return saveItems(
    DOKUMEN_PENTING_STORAGE_KEY,
    Array.isArray(dokumen)
      ? dokumen
      : []
  )
}


export function addDokumenPenting(
  dokumen
) {

  return addItem(
    DOKUMEN_PENTING_STORAGE_KEY,
    dokumen,
    'dokumen'
  )
}


export function updateDokumenPenting(
  id,
  updatedData
) {

  return updateItem(
    DOKUMEN_PENTING_STORAGE_KEY,
    id,
    updatedData
  )
}


export function deleteDokumenPenting(
  id
) {

  return deleteItem(
    DOKUMEN_PENTING_STORAGE_KEY,
    id
  )
}


export function clearDokumenPenting() {
  return clearItems(
    DOKUMEN_PENTING_STORAGE_KEY
  )
}


export function hasDokumenPenting() {
  return (
    getDokumenPenting().length > 0
  )
}


export function countDokumenPenting() {
  return getDokumenPenting().length
}


// =========================================
// GET ALL STORAGE DATA
// =========================================

export function getAllStorageData() {

  return {

    members:
      getMembers(),

    kegiatan:
      getKegiatan(),

    koordinator:
      getKoordinator(),

    iuran:
      getIuran(),

    adrt:
      getADRT(),

    dokumenPenting:
      getDokumenPenting(),
  }
}


// =========================================
// STORAGE SUMMARY
// =========================================

export function getStorageSummary() {

  const members =
    getMembers()


  const kegiatan =
    getKegiatan()


  const koordinator =
    getKoordinator()


  const iuran =
    getIuran()


  const adrt =
    getADRT()


  const dokumenPenting =
    getDokumenPenting()


  const summary = {

    members:
      members.length,

    kegiatan:
      kegiatan.length,

    koordinator:
      koordinator.length,

    iuran:
      iuran.length,

    adrt:
      adrt.length,

    dokumenPenting:
      dokumenPenting.length,
  }


  const total =
    Object.values(summary)
      .reduce(
        (sum, value) =>
          sum + value,
        0
      )


  return {
    ...summary,
    total,
  }
}


// =========================================
// CHECK ANY DATA
// =========================================

export function hasAnyStorageData() {

  return (

    getMembers().length > 0 ||

    getKegiatan().length > 0 ||

    getKoordinator().length > 0 ||

    getIuran().length > 0 ||

    getADRT().length > 0 ||

    getDokumenPenting().length > 0
  )
}


// =========================================
// CLEAR ALL APPLICATION STORAGE
// =========================================
//
// Hanya menghapus key milik aplikasi.
//
// Tidak menggunakan:
// localStorage.clear()
//
// Return:
// {
//   success,
//   message,
//   removedKeys,
//   failedKeys
// }
// =========================================

export function clearAllStorage() {

  const removedKeys = []

  const failedKeys = []


  if (!isBrowserStorageAvailable()) {

    return {

      success: false,

      message:
        'localStorage tidak tersedia.',

      removedKeys: [],

      failedKeys:
        APPLICATION_STORAGE_KEYS.map(
          (key) => ({
            key,
            error:
              'localStorage tidak tersedia.',
          })
        ),
    }
  }


  for (
    const key
    of APPLICATION_STORAGE_KEYS
  ) {

    try {

      const existed =
        localStorage.getItem(key) !== null


      localStorage.removeItem(key)


      if (existed) {
        removedKeys.push(key)
      }

    } catch (error) {

      console.error(
        `Gagal menghapus storage key: ${key}`,
        error
      )


      failedKeys.push({

        key,

        error,
      })
    }
  }


  if (failedKeys.length > 0) {

    return {

      success: false,

      message:
        'Reset data selesai sebagian. Beberapa data gagal dihapus.',

      removedKeys,

      failedKeys,
    }
  }


  return {

    success: true,

    message:
      'Semua data aplikasi berhasil dihapus.',

    removedKeys,

    failedKeys: [],
  }
}


// =========================================
// VERIFY RESET
// =========================================

export function verifyStorageReset() {

  if (!isBrowserStorageAvailable()) {

    return {

      success: false,

      remainingKeys:
        [...APPLICATION_STORAGE_KEYS],

      reason:
        'localStorage tidak tersedia.',
    }
  }


  const remainingKeys =
    APPLICATION_STORAGE_KEYS.filter(
      (key) =>
        localStorage.getItem(key) !== null
    )


  return {

    success:
      remainingKeys.length === 0,

    remainingKeys,
  }
}


// =========================================
// RESET + VERIFY
// =========================================

export function resetAllApplicationData() {

  const resetResult =
    clearAllStorage()


  if (!resetResult.success) {

    return {

      ...resetResult,

      verified: false,
    }
  }


  const verification =
    verifyStorageReset()


  if (!verification.success) {

    return {

      success: false,

      message:
        'Reset selesai tetapi verifikasi menemukan data yang masih tersimpan.',

      removedKeys:
        resetResult.removedKeys,

      failedKeys:
        resetResult.failedKeys,

      remainingKeys:
        verification.remainingKeys,

      verified: false,
    }
  }


  return {

    success: true,

    message:
      'Semua data aplikasi berhasil di-reset.',

    removedKeys:
      resetResult.removedKeys,

    failedKeys: [],

    remainingKeys: [],

    verified: true,
  }
}


// =========================================
// STORAGE EVENT HELPER
// =========================================

export function subscribeStorage(
  callback
) {

  if (
    typeof window === 'undefined'
  ) {
    return () => {}
  }


  if (
    typeof callback !== 'function'
  ) {
    return () => {}
  }


  const handler = (
    event
  ) => {

    // Hanya proses event yang berasal
    // dari localStorage.
    if (
      event?.storageArea &&
      event.storageArea !==
        window.localStorage
    ) {
      return
    }


    callback(event)
  }


  window.addEventListener(
    'storage',
    handler
  )


  // Return unsubscribe function
  return () => {

    window.removeEventListener(
      'storage',
      handler
    )
  }
}


// =========================================
// DEFAULT EXPORT
// =========================================

const storage = {

  // Anggota
  getMembers,
  saveMembers,
  addMember,
  updateMember,
  deleteMember,
  clearMembers,
  hasMembers,
  countMembers,


  // Kegiatan
  getKegiatan,
  saveKegiatan,
  addKegiatan,
  updateKegiatan,
  deleteKegiatan,
  clearKegiatan,
  hasKegiatan,
  countKegiatan,


  // Koordinator
  getKoordinator,
  saveKoordinator,
  addKoordinator,
  updateKoordinator,
  deleteKoordinator,
  clearKoordinator,
  hasKoordinator,
  countKoordinator,


  // Iuran
  getIuran,
  saveIuran,
  addIuran,
  updateIuran,
  deleteIuran,
  clearIuran,
  hasIuran,
  countIuran,


  // AD/ART
  getADRT,
  saveADRT,
  addADRT,
  updateADRT,
  deleteADRT,
  clearADRT,
  hasADRT,
  countADRT,


  // Dokumen Penting
  getDokumenPenting,
  saveDokumenPenting,
  addDokumenPenting,
  updateDokumenPenting,
  deleteDokumenPenting,
  clearDokumenPenting,
  hasDokumenPenting,
  countDokumenPenting,


  // Data keseluruhan
  getAllStorageData,
  getStorageSummary,
  hasAnyStorageData,


  // Reset
  APPLICATION_STORAGE_KEYS,
  clearAllStorage,
  verifyStorageReset,
  resetAllApplicationData,


  // Event
  subscribeStorage,
}


export default storage