import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function AuthenticatedRouter() {
  const auth = useAuth();
  const [location, navigate] = useLocation();
  const isLoginRoute = location === "/login";

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.isAuthenticated && !isLoginRoute) navigate("/login");
    if (auth.isAuthenticated && isLoginRoute) navigate("/");
  }, [auth.isAuthenticated, auth.loading, isLoginRoute, navigate]);

  if (auth.loading) return <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] text-sm text-[#718076]">正在確認登入狀態 · Checking session…</div>;
  if (!auth.isAuthenticated) return <Login />;
  return <Router />;
}

function App() {
  return <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <AuthenticatedRouter />
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>;
}

export default App;
