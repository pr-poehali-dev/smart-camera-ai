import { useState, useEffect } from 'react';
import Auth from '@/pages/Auth';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'profile'>('home');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохраненную сессию
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleAuth = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onAuth={handleAuth} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {currentPage === 'home' && <Home onNavigate={setCurrentPage} user={user} />}
      {currentPage === 'profile' && <Profile onNavigate={setCurrentPage} user={user} onLogout={handleLogout} />}
      <Toaster />
    </div>
  );
}

export default App;