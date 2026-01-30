import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import BottomNav from '@/components/BottomNav';

interface HomeProps {
  onNavigate: (page: 'home' | 'profile') => void;
}

const Home = ({ onNavigate }: HomeProps) => {
  const mockHistory = [
    { id: 1, title: 'Яблоко Гренни Смит', category: 'Фрукты', time: '2 минуты назад', confidence: 95 },
    { id: 2, title: 'Кот британской породы', category: 'Животные', time: '1 час назад', confidence: 89 },
    { id: 3, title: 'iPhone 15 Pro Max', category: 'Электроника', time: '3 часа назад', confidence: 97 },
  ];

  const isYandexConnected = false;

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">AI Camera</h1>
            <p className="text-purple-300 text-sm">Умное распознавание объектов</p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-lg opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl">
              <Icon name="Sparkles" className="text-white" size={28} />
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30 backdrop-blur-xl p-4 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-xl">
                <Icon name="User" className="text-white" size={20} />
              </div>
              <div>
                <p className="text-white font-semibold">Интеграция Яндекс</p>
                <p className="text-purple-300 text-xs">
                  {isYandexConnected ? 'Подключена' : 'Не подключена'}
                </p>
              </div>
            </div>
            {isYandexConnected ? (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <Icon name="Check" size={14} className="mr-1" />
                Активна
              </Badge>
            ) : (
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0">
                Подключить
              </Button>
            )}
          </div>
        </Card>

        <div className="relative mb-8 animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 blur-2xl opacity-30 animate-pulse"></div>
          <Button 
            className="relative w-full h-32 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white text-xl font-bold rounded-3xl border-2 border-white/20 shadow-2xl hover-scale"
          >
            <div className="flex flex-col items-center gap-2">
              <Icon name="ScanLine" size={48} className="animate-pulse" />
              <span>Сканировать</span>
            </div>
          </Button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">История сканирований</h2>
          <Button variant="ghost" size="sm" className="text-purple-300 hover:text-purple-200">
            Все
            <Icon name="ChevronRight" size={16} className="ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {mockHistory.map((item, index) => (
            <Card 
              key={item.id}
              className="bg-slate-900/60 border-slate-700/50 backdrop-blur-lg p-4 hover-scale cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl">
                  <Icon name="Camera" className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-0">
                      {item.category}
                    </Badge>
                    <span className="text-slate-400">{item.time}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <Icon name="Target" size={14} className="text-green-400" />
                    <span className="text-green-400 font-semibold text-sm">{item.confidence}%</span>
                  </div>
                  <Icon name="ChevronRight" size={20} className="text-slate-500" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav currentPage="home" onNavigate={onNavigate} />
    </div>
  );
};

export default Home;
