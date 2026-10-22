import { ChartNoAxesColumn, BookOpen, House, UserRound, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Главная', icon: House },
  { to: '/course', label: 'Уроки', icon: BookOpen },
  { to: '/stats', label: 'Статистика', icon: ChartNoAxesColumn },
  { to: '/profile', label: 'Профиль', icon: UserRound },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Главное меню"
      className="pb-safe fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] rounded-t-card bg-surface shadow-float"
    >
      <ul className="grid grid-cols-4 px-2 pt-2 pb-2">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 rounded-tile text-xs transition-colors ${
                  isActive ? 'font-bold text-ink' : 'font-semibold text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={24} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
