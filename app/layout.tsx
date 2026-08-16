'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Geral', path: '/', icon: '📊' },
    { name: 'Financeiro', path: '/financeiro', icon: '💰' },
    { name: 'Obras', path: '/obras', icon: '🏗️' },
    { name: 'Frota', path: '/frota', icon: '🚚' },
    { name: 'Equipe', path: '/funcionarios', icon: '👥' },
  ];

  return (
    <html lang="pt-BR">
      <body className="bg-slate-900 text-slate-100 min-h-screen flex flex-col antialiased">
        {isLoginPage ? (
          children
        ) : (
          <div className="flex flex-col min-h-screen pb-16 md:pb-0">
            <header className="bg-slate-800/90 backdrop-blur sticky top-0 z-40 border-b border-slate-700/80 px-4 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <span className="text-xl md:text-2xl font-black text-yellow-400 tracking-wider">
                  MEGAWATTS
                </span>

                <nav className="hidden md:flex items-center gap-2">
                  {menuItems.map((item) => {
                    const ativo = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                          ativo
                            ? 'bg-yellow-500 text-slate-950 font-bold shadow-md'
                            : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <button
                  onClick={handleLogout}
                  className="bg-slate-700/80 hover:bg-rose-600/80 text-slate-200 hover:text-white text-xs md:text-sm font-semibold py-2 px-3 rounded-lg transition"
                >
                  Sair 🚪
                </button>
              </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
              {children}
            </main>

            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur border-t border-slate-700 z-50 flex justify-around items-center py-2 px-1">
              {menuItems.map((item) => {
                const ativo = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex flex-col items-center justify-center w-full py-1 text-xs transition-colors ${
                      ativo ? 'text-yellow-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-lg mb-0.5">{item.icon}</span>
                    <span className="truncate max-w-[64px] text-[10px] sm:text-xs">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </body>
    </html>
  );
}