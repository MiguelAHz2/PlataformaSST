import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <main className="flex-1 min-h-screen w-full min-w-0 lg:ml-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white border-b border-slate-800 shadow-sm lg:hidden">
          <button
            type="button"
            aria-label="Abrir menú de navegación"
            aria-expanded={mobileNavOpen}
            className="p-2 -ml-1 rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-sm tracking-tight">SST Plataforma</span>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
