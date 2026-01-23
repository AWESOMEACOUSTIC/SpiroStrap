import { Navigate, Route, Routes } from "react-router-dom";

import ThemeProvider from "./providers/ThemeProvider";

import Shell from "./layouts/Shell";

import Live from "./pages/Live/Live";
import Sessions from "./pages/Session/Sessions";
import SessionDetail from "./pages/SessionDetail/SessionDetail";
import Settings from "./pages/Settings/Settings";

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Navigate to="/live" replace />} />
          <Route path="live" element={<Live />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:sessionId" element={<SessionDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/live" replace />} />
      </Routes>
    </ThemeProvider>
  );
}