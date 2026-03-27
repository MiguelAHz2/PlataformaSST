import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, BookOpen, ClipboardList, LogOut,
  Shield, GraduationCap, Award, ChevronRight, FolderOpen, Building2, X, Newspaper,
} from 'lucide-react';

type SidebarProps = {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/companies', icon: Building2, label: 'Empresas' },
  { to: '/admin/resources', icon: Newspaper, label: 'Recursos informativos' },
  { to: '/admin/courses', icon: BookOpen, label: 'Cursos' },
  { to: '/admin/evaluations', icon: ClipboardList, label: 'Evaluaciones' },
  { to: '/admin/workshops', icon: FolderOpen, label: 'Talleres' },
];

const studentLinks = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/student/resources', icon: Newspaper, label: 'Recursos SST' },
  { to: '/student/courses', icon: BookOpen, label: 'Mis Cursos' },
  { to: '/student/evaluations', icon: ClipboardList, label: 'Evaluaciones' },
  { to: '/student/workshops', icon: FolderOpen, label: 'Talleres' },
  { to: '/student/grades', icon: Award, label: 'Calificaciones' },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    onCloseMobile?.();
    navigate('/login');
  };

  const afterNav = () => {
    onCloseMobile?.();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] max-w-[18rem] bg-slate-900 flex flex-col shadow-xl transition-transform duration-200 ease-out lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">SST Plataforma</p>
              <p className="text-slate-400 text-xs">Seguridad Laboral</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex-shrink-0"
            onClick={onCloseMobile}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-400 font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isAdmin ? (
                <span className="text-xs text-blue-400 font-medium">Administrador</span>
              ) : (
                <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  Estudiante
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation — scroll independiente en pantallas bajas (móvil) */}
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain touch-pan-y">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mb-3">
          {isAdmin ? 'Administración' : 'Mi aprendizaje'}
        </p>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={afterNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
