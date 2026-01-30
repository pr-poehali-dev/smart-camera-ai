import { useState } from 'react';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'profile'>('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {currentPage === 'home' && <Home onNavigate={setCurrentPage} />}
      {currentPage === 'profile' && <Profile onNavigate={setCurrentPage} />}
      <Toaster />
    </div>
  );
}

export default App;