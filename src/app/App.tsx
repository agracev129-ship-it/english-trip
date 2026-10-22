import { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AppLayout } from './AppLayout';
import { HomeScreen } from '../screens/HomeScreen';
import { CourseScreen } from '../screens/CourseScreen';
import { TopicScreen } from '../screens/TopicScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AudioTestScreen } from '../screens/AudioTestScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { db } from '../db/db';
import { initProgress } from '../db/progress';
import { startActivityTracking } from '../lib/activity';
import { setHaptics } from '../lib/haptics';

// HashRouter: адреса вида /#/stats. GitHub Pages не умеет SPA-роутинг, а хеш работает везде.
// reducedMotion="user": если в телефоне включено «уменьшить движение», анимации отключаются.
export function App() {
  const profile = useLiveQuery(() => db.profile.get('me'));

  useEffect(() => {
    void initProgress();
    return startActivityTracking();
  }, []);

  useEffect(() => {
    if (profile) setHaptics(profile.settings.haptics);
  }, [profile]);

  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Routes>
          <Route path="lesson/:lessonId" element={<LessonScreen />} />
          <Route element={<AppLayout />}>
            <Route index element={<HomeScreen />} />
            <Route path="course" element={<CourseScreen />} />
            <Route path="course/:weekId" element={<TopicScreen />} />
            <Route path="stats" element={<StatsScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="dev/audio" element={<AudioTestScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </MotionConfig>
  );
}
