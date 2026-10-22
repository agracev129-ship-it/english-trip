import { MotionConfig } from 'motion/react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './AppLayout';
import { HomeScreen } from '../screens/HomeScreen';
import { CourseScreen } from '../screens/CourseScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// HashRouter: адреса вида /#/stats. GitHub Pages не умеет SPA-роутинг, а хеш работает везде.
// reducedMotion="user": если в телефоне включено «уменьшить движение», анимации отключаются.
export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomeScreen />} />
            <Route path="course" element={<CourseScreen />} />
            <Route path="stats" element={<StatsScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </MotionConfig>
  );
}
