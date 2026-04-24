import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const handleLogout = async () => {
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6] text-[#1F2937] font-sans overflow-hidden">
      <aside className="w-64 bg-green-900 text-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="bg-white text-green-900 px-2 py-0.5 rounded">RPP</span> Generator Pro
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="/rpp/new" className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 rounded-lg text-sm font-semibold transition-colors hover:bg-green-700">
            <span>+</span> Buat RPP Baru
          </Link>
          <div className="pt-4 pb-2 text-xs uppercase text-green-200 font-bold tracking-widest px-4">
            Navigasi
          </div>
          <Link to="/dashboard" className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-800 rounded-lg text-sm text-green-50">
            <BookOpen className="w-4 h-4" />
            Dashboard
          </Link>
        </nav>
        <div className="p-6 border-t border-green-800 flex flex-col gap-3">
          <div className="text-xs text-green-300 break-words">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-green-300 hover:text-white transition-colors text-sm font-medium w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-y-auto w-full">
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
