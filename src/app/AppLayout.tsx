import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  const { pathname } = useLocation();

  // При переходе между вкладками экран начинается сверху
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] overflow-x-clip bg-bg">
      {/* Отступ снизу под нижнее меню */}
      <main className="pb-[calc(88px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
