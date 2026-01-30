import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HomeProps {
  onNavigate: (page: 'home' | 'profile') => void;
  user: any;
}

const API_SCAN = 'https://functions.poehali.dev/9cef3444-65a0-416d-8301-2e9dffbc4367';
const API_YANDEX = 'https://functions.poehali.dev/067eda8a-b33a-43d3-8354-a1ddf3bf5466';

const Home = ({ onNavigate, user }: HomeProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_scans: 0, average_confidence: 0 });
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_SCAN}?user_id=${user.user_id}`);
      const data = await response.json();
      
      if (response.ok) {
        setHistory(data.scans || []);
        setStats({
          total_scans: data.total_scans || 0,
          average_confidence: data.average_confidence || 0
        });
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const openCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: 'Ошибка доступа к камере',
        description: 'Разрешите доступ к камере в настройках браузера',
        variant: 'destructive'
      });
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setScanning(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];

    try {
      const response = await fetch(API_SCAN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          image: imageBase64
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: `Распознано: ${data.title}`,
          description: `Категория: ${data.category} | Точность: ${data.confidence}%`
        });
        closeCamera();
        loadHistory();
      } else {
        toast({
          title: 'Ошибка сканирования',
          description: data.error || 'Не удалось распознать объект',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка подключения',
        description: 'Проверьте интернет-соединение',
        variant: 'destructive'
      });
    } finally {
      setScanning(false);
    }
  };

  const connectYandex = async () => {
    try {
      const response = await fetch(API_YANDEX);
      const data = await response.json();
      if (data.auth_url) {
        window.location.href = `${data.auth_url}&state=${user.user_id}`;
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к Яндекс',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    return `${diffDays} дн назад`;
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">AI Camera</h1>
            <p className="text-purple-300 text-sm">Привет, {user.first_name || 'пользователь'}!</p>
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
                <Icon name="User" size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Интеграция Яндекс</p>
                <p className="text-purple-300 text-xs">
                  {user.yandex_connected ? 'Подключена' : 'Не подключена'}
                </p>
              </div>
            </div>
            {user.yandex_connected ? (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <Icon name="Check" size={14} className="mr-1" />
                Активна
              </Badge>
            ) : (
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                onClick={connectYandex}
              >
                Подключить
              </Button>
            )}
          </div>
        </Card>

        <div className="relative mb-8 animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 blur-2xl opacity-30 animate-pulse"></div>
          <Button 
            onClick={openCamera}
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
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-0">
            {stats.total_scans} всего
          </Badge>
        </div>

        {history.length === 0 ? (
          <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-lg p-8 text-center">
            <Icon name="Camera" size={48} className="mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">Пока нет сканирований</p>
            <p className="text-slate-500 text-sm mt-2">Нажмите кнопку "Сканировать" чтобы начать</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
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
                      <span className="text-slate-400">{formatTime(item.created_at)}</span>
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
        )}
      </div>

      <Dialog open={showCamera} onOpenChange={closeCamera}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Камера AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            <Button
              onClick={captureAndScan}
              disabled={scanning}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {scanning ? (
                <>
                  <Icon name="Loader2" className="animate-spin mr-2" size={20} />
                  Анализирую...
                </>
              ) : (
                <>
                  <Icon name="Camera" className="mr-2" size={20} />
                  Сканировать
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav currentPage="home" onNavigate={onNavigate} />
    </div>
  );
};

export default Home;
