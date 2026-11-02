import { lazy, Suspense, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AppLayout } from './AppLayout';
import { HomeScreen } from '../screens/HomeScreen';
import { LoadingScreen } from '../components/LoadingScreen';
import { db } from '../db/db';
import { initProgress } from '../db/progress';
import { startActivityTracking } from '../lib/activity';
import { setHaptics } from '../lib/haptics';

const CourseScreen = lazy(() =>
  import('../screens/CourseScreen').then((m) => ({ default: m.CourseScreen })),
);
const TopicScreen = lazy(() =>
  import('../screens/TopicScreen').then((m) => ({ default: m.TopicScreen })),
);
const StatsScreen = lazy(() =>
  import('../screens/StatsScreen').then((m) => ({ default: m.StatsScreen })),
);
const ProfileScreen = lazy(() =>
  import('../screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
const AudioTestScreen = lazy(() =>
  import('../screens/AudioTestScreen').then((m) => ({ default: m.AudioTestScreen })),
);
const LessonScreen = lazy(() =>
  import('../screens/LessonScreen').then((m) => ({ default: m.LessonScreen })),
);
const ReviewScreen = lazy(() =>
  import('../screens/ReviewScreen').then((m) => ({ default: m.ReviewScreen })),
);
const VocabScreen = lazy(() =>
  import('../screens/VocabScreen').then((m) => ({ default: m.VocabScreen })),
);

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
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="lesson/:lessonId" element={<LessonScreen />} />
            <Route path="review" element={<ReviewScreen />} />
            <Route element={<AppLayout />}>
              <Route index element={<HomeScreen />} />
              <Route path="course" element={<CourseScreen />} />
              <Route path="course/:weekId" element={<TopicScreen />} />
              <Route path="stats" element={<StatsScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
              <Route path="vocab" element={<VocabScreen />} />
              <Route path="dev/audio" element={<AudioTestScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </MotionConfig>
  );
}
