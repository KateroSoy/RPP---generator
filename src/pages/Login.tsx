import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input, Button, Label } from '../components/ui/forms';
import { BookOpen } from 'lucide-react';
import { getLocalUsers } from '../lib/db';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = getLocalUsers();
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    if (foundUser) {
      setUser({ uid: foundUser.id, email: foundUser.email, displayName: foundUser.name });
      navigate('/dashboard');
    } else {
      setError('Gagal login. Cek kembali email & password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <div className="bg-[#1E3A8A] text-white p-3 rounded-xl mb-4 shadow-sm">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Masuk ke RPP Generator Pro</h2>
        <p className="mt-2 pl-4 pr-4 text-sm text-gray-600">
          Buat perangkat ajar lebih cepat, rapi, dan mudah disesuaikan.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guru@sekolah.com"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">Masuk</Button>
              </div>
            </form>
            <div className="mt-6 text-center text-sm text-gray-500">
               <div>Test login: hasrajaya03@gmail.com / 123456</div>
              Belum punya akun? <Link to="/register" className="font-semibold text-green-600 hover:text-green-500">Daftar sekarang</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
