import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Input, Button, Label } from '../components/ui/forms';
import { BookOpen } from 'lucide-react';
import { saveLocalUser, getLocalUsers } from '../lib/db';
import { useAuth } from '../AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    const users = getLocalUsers();
    if (users.find((u: any) => u.email === email)) {
      setError('Email sudah terdaftar.');
      return;
    }
    const newUser = { id: Math.random().toString(36).substr(2, 9), name, email, password };
    saveLocalUser(newUser);
    setUser({ uid: newUser.id, email: newUser.email, displayName: newUser.name });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <div className="bg-[#1E3A8A] text-white p-3 rounded-xl mb-4 shadow-sm">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Daftar Akun Baru</h2>
        <p className="mt-2 text-sm text-gray-600">
          Bergabung dan mulai buat RPP Anda dalam hitungan menit.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
              <div className="space-y-1">
                <Label htmlFor="name">Nama Lengkap Guru</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Budi Santoso, S.Pd"
                />
              </div>
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
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" className="w-full">Daftar</Button>
              </div>
            </form>
            <div className="mt-6 text-center text-sm text-gray-500">
              Sudah punya akun? <Link to="/login" className="font-semibold text-green-600 hover:text-green-500">Masuk di sini</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
