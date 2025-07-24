import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Send, CreditCard, History, LogOut, Users, Menu, X, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, signOut } from '../lib/supabase';
import SendForm from '../components/SendForm';
import PaymentForm from '../components/PaymentForm';
import TransactionHistory from '../components/TransactionHistory';
import UserManagement from '../components/UserManagement';
import DailyBalances from '../components/DailyBalances';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user?.email === 'admin@example.com') {
      setIsAdmin(true);
    }
    // Extraire le nom d'utilisateur de l'email
    if (user?.email) {
      const name = user.email.split('@')[0];
      // Mettre la première lettre en majuscule
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    } finally {
      setLogoutLoading(false);
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Envoi de fonds';
      case '/payment': return 'Paiements';
      case '/history': return 'Historique';
      case '/users': return 'Utilisateurs';
      case '/balances': return 'Soldes';
      default: return 'Tableau de bord';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm hidden md:flex md:flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-xl">
              <div className="w-8 h-8 flex items-center justify-center text-xl font-bold text-blue-600">
                {userName.charAt(0)}
              </div>
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">
              {userName}
            </span>
          </div>
        </div>

        <div className="flex-1 py-8 px-4 space-y-2">
          <Link
            to="/"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
              location.pathname === '/' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Send className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
              location.pathname === '/' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <span className="font-medium">Envoi</span>
          </Link>
          <Link
            to="/payment"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
              location.pathname === '/payment'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CreditCard className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
              location.pathname === '/payment' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <span className="font-medium">Paiement</span>
          </Link>
          <Link
            to="/history"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
              location.pathname === '/history'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
              location.pathname === '/history' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <span className="font-medium">Historique</span>
          </Link>
          <Link
            to="/balances"
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
              location.pathname === '/balances'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calculator className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
              location.pathname === '/balances' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <span className="font-medium">Soldes</span>
          </Link>
          {isAdmin && (
            <Link
              to="/users"
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                location.pathname === '/users'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                location.pathname === '/users' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className="font-medium">Utilisateurs</span>
            </Link>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="flex items-center w-full px-4 py-3 text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 mr-3 transition-transform group-hover:scale-110 group-hover:text-red-600" />
            <span className="font-medium group-hover:text-red-600">
              {logoutLoading ? 'Déconnexion...' : 'Déconnexion'}
            </span>
          </button>
        </div>
      </nav>

      <div className="md:hidden fixed top-0 inset-x-0 z-50">
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-xl">
                <div className="w-6 h-6 flex items-center justify-center text-lg font-bold text-blue-600">
                  {userName.charAt(0)}
                </div>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">
                {userName}
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-200 bg-white"
              >
                <div className="p-4 space-y-2">
                  <Link
                    to="/"
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                      location.pathname === '/' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Send className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                      location.pathname === '/' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className="font-medium">Envoi</span>
                  </Link>
                  <Link
                    to="/payment"
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                      location.pathname === '/payment'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                      location.pathname === '/payment' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className="font-medium">Paiement</span>
                  </Link>
                  <Link
                    to="/history"
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                      location.pathname === '/history'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <History className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                      location.pathname === '/history' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className="font-medium">Historique</span>
                  </Link>
                  <Link
                    to="/balances"
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                      location.pathname === '/balances'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Calculator className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                      location.pathname === '/balances' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className="font-medium">Soldes</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/users"
                      className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                        location.pathname === '/users'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Users className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${
                        location.pathname === '/users' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium">Utilisateurs</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="flex items-center w-full px-4 py-3 text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                  >
                    <LogOut className="w-5 h-5 mr-3 transition-transform group-hover:scale-110 group-hover:text-red-600" />
                    <span className="font-medium group-hover:text-red-600">
                      {logoutLoading ? 'Déconnexion...' : 'Déconnexion'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <main className="md:pl-64 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="relative z-0"
            >
              <Routes>
                <Route path="/" element={<SendForm />} />
                <Route path="/payment" element={<PaymentForm />} />
                <Route path="/history" element={<TransactionHistory />} />
                <Route path="/balances" element={<DailyBalances />} />
                {isAdmin && <Route path="/users" element={<UserManagement />} />}
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
