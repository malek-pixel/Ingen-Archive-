import { Suspense, lazy, useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteLoading } from "./components/RouteLoading";

// Route-level code splitting. The Suspense fallback below is the designed
// loading state — skeleton grid plus the INDEXING ARCHIVE NODE scan banner.
const Overview = lazy(() => import("./routes/Overview"));
const Dashboard = lazy(() => import("./routes/Dashboard"));
const Database = lazy(() => import("./routes/Database"));
const SpecimenDetail = lazy(() => import("./routes/SpecimenDetail"));
const Personnel = lazy(() => import("./routes/Personnel"));
const PersonDetail = lazy(() => import("./routes/PersonDetail"));
const States = lazy(() => import("./routes/States"));
const NotFound = lazy(() => import("./routes/NotFound"));
const AllSpecimens = lazy(() => import("./routes/FullRun").then((m) => ({ default: m.AllSpecimens })));
const AllPersonnel = lazy(() => import("./routes/FullRun").then((m) => ({ default: m.AllPersonnel })));

/**
 * On navigation: scroll to the top (unless a hash targets a record in a full
 * run) and move focus to the new page's content.
 *
 * Without the focus move, a screen-reader or keyboard user stays parked on the
 * link they just activated while the whole page changes underneath them. The
 * target is made focusable programmatically only — tabIndex -1 keeps it out of
 * the tab order — and the first render is skipped so a fresh page load is not
 * yanked away from the browser's own starting point.
 */
function RouteChange() {
  const { pathname, hash } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
    if (first.current) {
      first.current = false;
      return;
    }

    // Focus the route wrapper, not #main: the Suspense fallback renders its own
    // #main, so focusing that would be thrown away the moment the real route
    // chunk resolves. The wrapper is keyed by pathname, so it is present in the
    // same commit and survives the swap.
    document.getElementById(ROUTE_ROOT_ID)?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return null;
}

const ROUTE_ROOT_ID = "ig-route-root";

export default function App() {
  const { pathname } = useLocation();
  return (
    <>
      <a className="ig-skip" href="#main">
        Skip to archive content
      </a>
      <RouteChange />
      <ErrorBoundary>
        {/* Keyed on pathname so each route plays one short entrance. The
            transition is 160ms — felt, never waited on. */}
        <div className="ig-route" id={ROUTE_ROOT_ID} tabIndex={-1} key={pathname}>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assets" element={<Database />} />
              <Route path="/assets/all" element={<AllSpecimens />} />
              <Route path="/assets/:id" element={<SpecimenDetail />} />
              <Route path="/personnel" element={<Personnel />} />
              <Route path="/personnel/all" element={<AllPersonnel />} />
              <Route path="/personnel/:id" element={<PersonDetail />} />
              <Route path="/states" element={<States />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
    </>
  );
}
