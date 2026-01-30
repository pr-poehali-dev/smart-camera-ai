import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface BottomNavProps {
  currentPage: 'home' | 'profile';
  onNavigate: (page: 'home' | 'profile') => void;
}

const BottomNav = ({ currentPage, onNavigate }: BottomNavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-4 py-3 animate-slide-in-right">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <Button
          variant="ghost"
          className={`flex flex-col items-center gap-1 h-auto py-2 px-6 ${
            currentPage === 'home'
              ? 'text-purple-400'
              : 'text-slate-400 hover:text-purple-300'
          }`}
          onClick={() => onNavigate('home')}
        >
          <Icon name="Home" size={24} />
          <span className="text-xs font-medium">Главная</span>
        </Button>

        <Button
          variant="ghost"
          className={`flex flex-col items-center gap-1 h-auto py-2 px-6 ${
            currentPage === 'profile'
              ? 'text-purple-400'
              : 'text-slate-400 hover:text-purple-300'
          }`}
          onClick={() => onNavigate('profile')}
        >
          <Icon name="User" size={24} />
          <span className="text-xs font-medium">Профиль</span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNav;
