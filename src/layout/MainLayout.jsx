import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaBroadcastTower, FaCog, FaSignOutAlt, FaRegEnvelope, FaCalendarAlt, FaChartBar, FaLayerGroup, FaSun, FaMoon } from 'react-icons/fa';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const [darkMode, setDarkMode] = useState(() => {
    // Persist dark mode in localStorage
    return localStorage.getItem('theme') === 'dark';
  });

  // Separate effect for auth check
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Separate effect for dark mode
  useEffect(() => {
    // Apply dark mode class to html
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Sidebar link data
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: <FaHome />, exact: true },
    { to: '/smart-bank', label: 'Smart Bank', icon: <FaLayerGroup /> },
    { to: '/profile', label: 'Profile', icon: <FaUser /> },
    { to: '/messages', label: 'Messages', icon: <FaRegEnvelope /> },
    { to: '/calendar', label: 'Calendar', icon: <FaCalendarAlt /> },
    { to: '/analytics', label: 'Analytics', icon: <FaChartBar /> },
    { to: '/settings', label: 'Settings', icon: <FaCog /> },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col py-8 px-4 min-h-screen transition-colors duration-300">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center">
            <FaLayerGroup className="text-indigo-500 text-2xl" />
          </div>
          <span className="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">Bank 4.0</span>
        </div>
        {/* Pages section */}
        <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold mb-2 px-2">PAGES</div>
        <nav className="flex-1">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-white ${location.pathname === link.to ? 'bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-white' : ''}`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
                  {link.label === 'Messages' && (
                    <span className="ml-auto bg-indigo-500 text-white text-xs rounded-full px-2 py-0.5">4</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* More section */}
        <div className="mt-8 text-xs text-gray-400 dark:text-gray-500 font-semibold mb-2 px-2">MORE</div>
        <nav>
          <ul className="space-y-1">
            <li>
              <Link to="/auth" className="flex items-center gap-3 px-3 py-2 rounded-lg transition text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-white">
                <FaSignOutAlt className="text-lg" />
                <span>Authentication</span>
              </Link>
            </li>
            <li>
              <Link to="/components" className="flex items-center gap-3 px-3 py-2 rounded-lg transition text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-white">
                <FaLayerGroup className="text-lg" />
                <span>Components</span>
              </Link>
            </li>
          </ul>
        </nav>
        {/* User info at bottom */}
        <div className="mt-auto flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 pt-5 px-2">
          <img
            src={user?.avatar}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover border"
          />
          <div>
            <div className="font-semibold text-gray-800 dark:text-white">{user?.fullname}</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-end items-center px-8 py-4 bg-white dark:bg-gray-800 shadow sticky top-0 z-20 border-b dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="flex items-center justify-center rounded-full text-gray-500 dark:text-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition p-0.5 border border-gray-200 dark:border-transparent"
              aria-label="Toggle dark mode"
              style={{ width: 24, height: 24 }}
            >
              {darkMode ? <FaSun className="text-base" /> : <FaMoon className="text-base" />}
            </button>
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400 shadow-sm"
              />
              <span className="text-base font-medium text-gray-700 dark:text-gray-200">{user?.fullname}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm px-4 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium ml-2"
              >
                <FaSignOutAlt className="text-base" /> Đăng xuất
              </button>
            </div>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto p-6 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
