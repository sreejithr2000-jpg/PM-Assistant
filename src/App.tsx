import { HashRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/store';
import { AppShell } from './components/AppShell';
import { Setup } from './screens/Setup';
import { Home } from './screens/Home';
import { Team } from './screens/Team';
import { MemberDetail } from './screens/MemberDetail';
import { Insights } from './screens/Insights';
import { Coaching } from './screens/Coaching';
import { Project } from './screens/Project';
import { Standup } from './screens/Standup';
import { Attendance } from './screens/Attendance';
import { Sprints } from './screens/Sprints';
import { Search } from './screens/Search';
import { Reports } from './screens/Reports';
import { Settings } from './screens/Settings';

export function App() {
  // First-run gate: no project dates or no team yet → onboarding (PRD §10 graceful degrade).
  const needsSetup = useStore((s) => !s.db.project.startDate || s.db.members.length === 0);
  if (needsSetup) return <Setup />;

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="team" element={<Team />} />
          <Route path="team/:id" element={<MemberDetail />} />
          <Route path="insights" element={<Insights />} />
          <Route path="coaching" element={<Coaching />} />
          <Route path="project" element={<Project />} />
          <Route path="sprints" element={<Sprints />} />
          <Route path="standup" element={<Standup />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="search" element={<Search />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
