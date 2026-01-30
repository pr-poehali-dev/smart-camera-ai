import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface AuthProps {
  onAuth: (userData: any) => void;
}

const API_AUTH = 'https://functions.poehali.dev/cfc48c35-5fec-47e0-9ad8-bbb197d5bef8';
const API_YANDEX = 'https://functions.poehali.dev/067eda8a-b33a-43d3-8354-a1ddf3bf5466';

const Auth = ({ onAuth }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          first_name: firstName,
          last_name: lastName
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        toast({
          title: isLogin ? 'Вход выполнен!' : 'Регистрация успешна!',
          description: `Добро пожаловать, ${data.first_name || 'пользователь'}!`
        });
        onAuth(data);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Что-то пошло не так',
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
      setLoading(false);
    }
  };

  const handleYandexAuth = async () => {
    try {
      const response = await fetch(API_YANDEX);
      const data = await response.json();
      
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к Яндекс',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Card className="w-full max-w-md bg-slate-900/60 border-slate-700/50 backdrop-blur-xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-50"></div>
            <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
              <Icon name="Camera" className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Camera</h1>
          <p className="text-purple-300">
            {isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
          </p>
        </div>

        <form onSubmit={handlePhoneAuth} className="space-y-4 mb-6">
          <div>
            <Label htmlFor="phone" className="text-white">
              Номер телефона
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+7 999 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <Label htmlFor="firstName" className="text-white">
                  Имя
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Иван"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  required={!isLogin}
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="text-white">
                  Фамилия
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Иванов"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            disabled={loading}
          >
            {loading ? (
              <Icon name="Loader2" className="animate-spin mr-2" size={20} />
            ) : null}
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-700"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-400">Или</span>
          </div>
        </div>

        <Button
          onClick={handleYandexAuth}
          variant="outline"
          className="w-full bg-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20"
        >
          <div className="bg-yellow-500 p-1 rounded mr-2">
            <Icon name="User" size={16} className="text-white" />
          </div>
          Войти через Яндекс
        </Button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-300 hover:text-purple-200 text-sm"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
