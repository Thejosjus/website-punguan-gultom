import { useState } from 'react'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

import Dashboard from './pages/Dashboard'
import Anggota from './components/Anggota'
import KoordinatorWilayah from './components/KoordinatorWilayah'
import IuranTahunan from './components/IuranTahunan'
import Kegiatan from './components/Kegiatan'
import ADRT from './components/ADRT'
import DokumenPenting from './components/DokumenPenting'
import Admin from './pages/Admin'


function App() {

  const [activeMenu, setActiveMenu] =
    useState('Dashboard')


  // =========================================================
  // RENDER HALAMAN
  // =========================================================

  const renderPage = () => {

    switch (activeMenu) {

      // =====================================================
      // DASHBOARD
      // =====================================================

      case 'Dashboard':
        return <Dashboard />


      // =====================================================
      // ANGGOTA
      // =====================================================

      case 'Anggota':
        return <Anggota />


      // =====================================================
      // KOORDINATOR WILAYAH
      // =====================================================

      case 'Koordinator Wilayah':
        return <KoordinatorWilayah />


      // =====================================================
      // IURAN TAHUNAN
      // =====================================================

      case 'Iuran Tahunan':
        return <IuranTahunan />


      // =====================================================
      // KEGIATAN
      // =====================================================

      case 'Kegiatan':
        return <Kegiatan />


      // =====================================================
      // AD / RT
      // =====================================================

      case 'AD/RT':
        return <ADRT />


      // =====================================================
      // DOKUMEN PENTING
      // =====================================================

      case 'Dokumen Penting':
        return <DokumenPenting />


      // =====================================================
      // ADMIN
      // =====================================================

      case 'Admin':
        return <Admin />


      // =====================================================
      // DEFAULT
      // =====================================================

      default:
        return <Dashboard />

    }

  }


  // =========================================================
  // RENDER APP
  // =========================================================

  return (

    <div className="app">

      {/* =========================================
          SIDEBAR
      ========================================= */}

      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />


      {/* =========================================
          MAIN WRAPPER
      ========================================= */}

      <div className="main-wrapper">


        {/* =========================================
            TOPBAR
        ========================================= */}

        <Topbar
          activeMenu={activeMenu}
        />


        {/* =========================================
            MAIN CONTENT
        ========================================= */}

        <main className="main-content">

          {renderPage()}

        </main>


      </div>

    </div>

  )

}

export default App