import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import BottomNav from '@/components/BottomNav';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ProfileProps {
  onNavigate: (page: 'home' | 'profile') => void;
}

const Profile = ({ onNavigate }: ProfileProps) => {
  const { toast } = useToast();

  const handleDeleteAccount = () => {
    toast({
      title: 'Аккаунт удалён',
      description: 'Ваши данные успешно удалены из базы данных',
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Профиль</h1>
          <Button variant="ghost" size="icon" className="text-purple-300 hover:text-purple-200">
            <Icon name="Settings" size={24} />
          </Button>
        </div>

        <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30 backdrop-blur-xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-md opacity-50"></div>
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 w-20 h-20 rounded-full flex items-center justify-center">
                <Icon name="User" className="text-white" size={36} />
              </div>
            </div>
            <div>
              <h2 className="text-white text-xl font-bold mb-1">Иван Иванов</h2>
              <p className="text-purple-300 text-sm mb-2">+7 999 123 45 67</p>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <Icon name="Check" size={12} className="mr-1" />
                Верифицирован
              </Badge>
            </div>
          </div>
        </Card>

        <div className="space-y-3 mb-6">
          <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-lg p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl">
                  <Icon name="Camera" size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Всего сканирований</p>
                  <p className="text-slate-400 text-sm">За всё время</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-white">127</span>
            </div>
          </Card>

          <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-lg p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-xl">
                  <Icon name="Target" size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Средняя точность</p>
                  <p className="text-slate-400 text-sm">Распознавание AI</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-400">94%</span>
            </div>
          </Card>
        </div>

        <h3 className="text-white font-bold mb-3">Настройки</h3>
        
        <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-lg p-4 mb-3 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Bell" size={20} className="text-purple-300" />
                <span className="text-white">Уведомления</span>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="bg-slate-700/50" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Download" size={20} className="text-purple-300" />
                <span className="text-white">Оффлайн экспорт</span>
              </div>
              <Switch />
            </div>
            <Separator className="bg-slate-700/50" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Share2" size={20} className="text-purple-300" />
                <span className="text-white">Быстрый экспорт</span>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-lg p-4 mb-3 animate-fade-in">
          <Button variant="ghost" className="w-full justify-start text-white hover:text-purple-300 p-0">
            <Icon name="Filter" size={20} className="mr-3 text-purple-300" />
            Настройки фильтров
            <Icon name="ChevronRight" size={20} className="ml-auto text-slate-500" />
          </Button>
        </Card>

        <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-lg p-4 mb-6 animate-fade-in">
          <Button variant="ghost" className="w-full justify-start text-white hover:text-blue-300 p-0">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-xl mr-3">
              <Icon name="Link" size={16} className="text-white" />
            </div>
            Подключить Яндекс ID
            <Icon name="ChevronRight" size={20} className="ml-auto text-slate-500" />
          </Button>
        </Card>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
            >
              <Icon name="Trash2" size={20} className="mr-2" />
              Удалить аккаунт
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Удалить аккаунт?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Это действие нельзя отменить. Все ваши данные будут безвозвратно удалены из базы данных, включая историю сканирований.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAccount}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <BottomNav currentPage="profile" onNavigate={onNavigate} />
    </div>
  );
};

export default Profile;
