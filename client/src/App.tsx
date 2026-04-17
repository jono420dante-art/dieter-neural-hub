import { useState } from "react";
import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import PasswordGate from "./pages/password-gate";
import Dashboard from "./pages/dashboard";
import SecurityTerminal from "./pages/security-terminal";
import AIChat from "./pages/ai-chat";
import NeuralSearch from "./pages/neural-search";
import NotFound from "./pages/not-found";
import spaceNebulaUrl from "@assets/space-nebula.jpg";

const NAV_ITEMS = [
  { path: "/", label: "COMMAND", icon: "⬡" },
  { path: "/security", label: "SECURITY", icon: "🛡" },
  { path: "/chat", label: "AI BRAIN", icon: "🧠" },
  { path: "/search", label: "SEARCH", icon: "🔮" },
];

function AppLayout() {
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Subtle background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${spaceNebulaUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.06) saturate(0.3)",
        }}
      />
      <div className="fixed inset-0 z-0 dieter-grid-bg opacity-10" />

      {/* Sidebar */}
      <aside
        className={`relative z-10 flex flex-col border-r transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-52"}`}
        style={{
          background: "rgba(11, 15, 20, 0.85)",
          borderColor: "rgba(61, 82, 83, 0.15)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: "rgba(61, 82, 83, 0.15)" }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-2 w-full"
          >
            <svg viewBox="0 0 32 32" className="w-7 h-7 flex-shrink-0" aria-label="DIETER Logo">
              <defs>
                <linearGradient id="d-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3DF2E0" />
                  <stop offset="100%" stopColor="#4CC9F0" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="14" fill="none" stroke="url(#d-grad)" strokeWidth="1.5" opacity="0.6" />
              <circle cx="16" cy="16" r="8" fill="none" stroke="url(#d-grad)" strokeWidth="1" opacity="0.3" />
              <text x="16" y="20" textAnchor="middle" fill="url(#d-grad)" fontFamily="monospace" fontSize="12" fontWeight="700">D</text>
            </svg>
            {!sidebarCollapsed && (
              <div>
                <div className="text-xs font-mono font-bold tracking-widest" style={{ color: "#3DF2E0" }}>
                  DIETER
                </div>
                <div className="text-[8px] font-mono tracking-wider" style={{ color: "#3D5253" }}>
                  v6.1 NSH
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${sidebarCollapsed ? "justify-center" : ""}`}
                  style={{
                    background: isActive ? "rgba(61, 242, 224, 0.08)" : "transparent",
                    borderLeft: isActive ? "2px solid #3DF2E0" : "2px solid transparent",
                  }}
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  <span className="text-sm flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span
                      className="text-[11px] font-mono font-semibold tracking-wider"
                      style={{ color: isActive ? "#3DF2E0" : "rgba(205, 204, 202, 0.5)" }}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Status Footer */}
        <div className="p-3 border-t" style={{ borderColor: "rgba(61, 82, 83, 0.15)" }}>
          {!sidebarCollapsed ? (
            <div className="space-y-1.5">
              <StatusRow label="Encryption" value="AES-256" online />
              <StatusRow label="Zero Trust" value="ACTIVE" online />
              <StatusRow label="IDS" value="847K sigs" online />
              <div className="pt-1.5 mt-1.5" style={{ borderTop: "1px solid rgba(61, 82, 83, 0.1)" }}>
                <span className="text-[8px] font-mono block" style={{ color: "rgba(61, 82, 83, 0.4)" }}>
                  Transparent Programs & Design
                </span>
                <span className="text-[8px] font-mono block" style={{ color: "rgba(61, 82, 83, 0.3)" }}>
                  Commander Danté
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#3DF2E0", boxShadow: "0 0 6px #3DF2E0" }} />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/security" component={SecurityTerminal} />
            <Route path="/chat" component={AIChat} />
            <Route path="/search" component={NeuralSearch} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function StatusRow({ label, value, online }: { label: string; value: string; online: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono" style={{ color: "#3D5253" }}>{label}</span>
      <div className="flex items-center gap-1">
        <div className="w-1 h-1 rounded-full" style={{ background: online ? "#3DF2E0" : "#ef4444" }} />
        <span className="text-[9px] font-mono" style={{ color: online ? "#3DF2E0" : "#ef4444" }}>{value}</span>
      </div>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      {!authenticated ? (
        <PasswordGate onAuthenticated={() => setAuthenticated(true)} />
      ) : (
        <Router hook={useHashLocation}>
          <AppLayout />
        </Router>
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
