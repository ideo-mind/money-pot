import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import './index.css'
import { HomePage } from './pages/HomePage'
import { UnifiedWalletProvider } from "./components/UnifiedWalletProvider";
import { Layout } from "./components/Layout";
import { CreatePotPage } from "./pages/CreatePotPage";
import { PotsListPage } from "./pages/PotsListPage";
import { PotChallengePage } from "./pages/PotChallengePage";
import { DashboardPage } from "./pages/DashboardPage";
import { LeaderboardPage } from "./pages/LeaderboardPage"; // Import the new page
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "create", element: <CreatePotPage /> },
      { path: "pots", element: <PotsListPage /> },
      { path: "pots/:id", element: <PotChallengePage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "leaderboard", element: <LeaderboardPage /> }, // Add the new route
    ]
  },
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <UnifiedWalletProvider>
        <RouterProvider router={router} />
      </UnifiedWalletProvider>
    </ErrorBoundary>
  </StrictMode>,
)