import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PageTransition from "./PageTransition";
import ErrorBoundary from "../components/ErrorBoundary";

export default function Shell() {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-dvh max-w-8xl">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="min-w-0 flex-1 p-4 md:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname}>
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
              </PageTransition>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}