import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { MediaCreationHub } from "./components/MediaCreationHub";
import { SplashScreen } from "./components/SplashScreen";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import { AuthPage } from "./pages/AuthPage";
import { ExplorePage } from "./pages/ExplorePage";
import { HomePage } from "./pages/HomePage";
import { MessagesPage } from "./pages/MessagesPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReelsPage } from "./pages/ReelsPage";
import { SavedPage } from "./pages/SavedPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UserProfilePage } from "./pages/UserProfilePage";

// ─── Layout with BottomNav ────────────────────────────────────────────────────

function AppLayout() {
  const [creationHubOpen, setCreationHubOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Phone frame on desktop */}
      <div className="mx-auto max-w-[430px] min-h-screen relative overflow-x-hidden">
        <Outlet />
        <BottomNav onUploadClick={() => setCreationHubOpen(true)} />
        <MediaCreationHub
          open={creationHubOpen}
          onOpenChange={setCreationHubOpen}
        />
      </div>
    </div>
  );
}

// ─── Router Setup ─────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: AppLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: ExplorePage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: NotificationsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/user/$userId",
  component: UserProfilePage,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: MessagesPage,
});

const savedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saved",
  component: SavedPage,
});

const reelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reels",
  component: ReelsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  exploreRoute,
  notificationsRoute,
  profileRoute,
  userProfileRoute,
  messagesRoute,
  savedRoute,
  reelsRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  if (isInitializing) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthPage needsProfile={false} />;
  }

  if (profileLoading && !profileFetched) {
    return <SplashScreen />;
  }

  if (isAuthenticated && profileFetched && profile === null) {
    return <AuthPage needsProfile={true} />;
  }

  return <RouterProvider router={router} />;
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <AuthGate />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.22 0.015 280)",
            border: "1px solid oklch(0.28 0.015 270)",
            color: "oklch(0.96 0.005 260)",
          },
        }}
      />
    </>
  );
}
