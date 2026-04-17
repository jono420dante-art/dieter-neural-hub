import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as localSim from "@/lib/local-sim";
import type { ScanJob } from "@shared/schema";

const TOOLS = [
  { id: "nmap", label: "Nmap", desc: "Network discovery & port scanning", icon: "🔍" },
  { id: "nikto", label: "Nikto", desc: "Web server vulnerability scanner", icon: "🕷" },
  { id: "golismero", label: "Golismero", desc: "Orchestrated security testing", icon: "🎯" },
  { id: "bdfproxy", label: "BDFProxy", desc: "Traffic interception & analysis", icon: "📡" },
];

const ACCESS_CODE = "Pielanie420";

export default function SecurityTerminal() {
  const [selectedTool, setSelectedTool] = useState("nmap");
  const [target, setTarget] = useState("");
  const [activeOutput, setActiveOutput] = useState<ScanJob | null>(null);

  // Auth popup state
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [authShake, setAuthShake] = useState(false);
  const authInputRef = useRef<HTMLInputElement>(null);

  const { data: scans = [], isLoading } = useQuery<ScanJob[]>({
    queryKey: ["/api/scans"],
    refetchInterval: 3000,
  });

  const [localScans, setLocalScans] = useState<ScanJob[]>([]);
  const [useLocal, setUseLocal] = useState(false);

  const refreshLocalScans = useCallback(() => {
    setLocalScans(localSim.getScans() as unknown as ScanJob[]);
  }, []);

  const runScan = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/scans", {
          tool: selectedTool,
          target,
          status: "queued",
          createdAt: new Date().toISOString(),
        });
        return res.json();
      } catch {
        // Fallback: run locally
        setUseLocal(true);
        const job = localSim.createScan(selectedTool, target);
        // Poll for completion
        const poll = setInterval(() => {
          refreshLocalScans();
          const updated = localSim.getScan(job.id);
          if (updated && updated.status === "completed") clearInterval(poll);
        }, 1000);
        refreshLocalScans();
        return job;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      setTarget("");
    },
  });

  // Use local scans when backend is unavailable
  const displayScans = useLocal ? localScans : scans;

  // Poll for active scan output
  const activeScan = displayScans.find(s => s.status === "running");

  // Focus auth input when popup opens
  useEffect(() => {
    if (showAuthPopup && authInputRef.current) {
      setTimeout(() => authInputRef.current?.focus(), 100);
    }
  }, [showAuthPopup]);

  // Handle scan button click — show auth popup
  const handleScanClick = () => {
    if (!target.trim()) return;
    setAuthPassword("");
    setAuthError(false);
    setAuthShake(false);
    setShowAuthPopup(true);
  };

  // Handle auth submission
  const handleAuthSubmit = () => {
    if (authPassword === ACCESS_CODE) {
      setShowAuthPopup(false);
      setAuthPassword("");
      setAuthError(false);
      runScan.mutate();
    } else {
      setAuthError(true);
      setAuthShake(true);
      setTimeout(() => setAuthShake(false), 600);
      setAuthPassword("");
    }
  };

  const handleAuthKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAuthSubmit();
    if (e.key === "Escape") {
      setShowAuthPopup(false);
      setAuthPassword("");
      setAuthError(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-mono font-bold tracking-wider" style={{ color: "#3DF2E0" }}>
          SECURITY TERMINAL
        </h1>
        <p className="text-xs font-mono mt-1" style={{ color: "#3D5253" }}>
          Penetration testing tools — authorised use only
        </p>
      </div>

      {/* Tool Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            className="p-3 rounded-lg border text-left transition-all duration-300"
            style={{
              background: selectedTool === tool.id ? "rgba(61, 242, 224, 0.08)" : "rgba(11, 15, 20, 0.6)",
              borderColor: selectedTool === tool.id ? "rgba(61, 242, 224, 0.4)" : "rgba(61, 82, 83, 0.2)",
              boxShadow: selectedTool === tool.id ? "0 0 15px rgba(61, 242, 224, 0.1)" : "none",
            }}
            data-testid={`button-tool-${tool.id}`}
          >
            <div className="text-lg mb-1">{tool.icon}</div>
            <div className="text-xs font-mono font-bold" style={{ color: selectedTool === tool.id ? "#3DF2E0" : "rgba(205, 204, 202, 0.8)" }}>
              {tool.label}
            </div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: "#3D5253" }}>
              {tool.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Scan Input */}
      <Card
        className="border"
        style={{ background: "rgba(11, 15, 20, 0.6)", borderColor: "rgba(61, 82, 83, 0.2)", backdropFilter: "blur(10px)" }}
      >
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-mono uppercase tracking-wider block mb-1.5" style={{ color: "#3D5253" }}>
                Target (IP / Domain)
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. 192.168.1.100 or target.com"
                className="w-full px-3 py-2 rounded-md font-mono text-sm outline-none transition-all"
                style={{
                  background: "rgba(11, 15, 20, 0.8)",
                  border: "1px solid rgba(61, 82, 83, 0.3)",
                  color: "#3DF2E0",
                  caretColor: "#3DF2E0",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "rgba(61, 242, 224, 0.4)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "rgba(61, 82, 83, 0.3)"}
                onKeyDown={(e) => { if (e.key === "Enter") handleScanClick(); }}
                data-testid="input-target"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleScanClick}
                disabled={!target.trim() || runScan.isPending}
                className="px-6 py-2 rounded-md font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, rgba(61, 242, 224, 0.15), rgba(76, 201, 240, 0.15))",
                  border: "1px solid rgba(61, 242, 224, 0.3)",
                  color: "#3DF2E0",
                }}
                data-testid="button-run-scan"
              >
                {runScan.isPending ? "LAUNCHING..." : `RUN ${selectedTool.toUpperCase()}`}
              </button>
            </div>
          </div>
          {activeScan && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4CC9F0", boxShadow: "0 0 8px #4CC9F0" }} />
              <span className="text-xs font-mono" style={{ color: "#4CC9F0" }}>
                {activeScan.tool.toUpperCase()} scanning {activeScan.target}...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ AUTHORIZATION POPUP ═══ */}
      {showAuthPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAuthPopup(false); setAuthPassword(""); setAuthError(false); } }}
        >
          <div
            className={`w-full max-w-md mx-4 rounded-xl border p-6 relative overflow-hidden ${authShake ? 'animate-shake' : ''}`}
            style={{
              background: "linear-gradient(180deg, rgba(11, 15, 20, 0.95), rgba(11, 15, 20, 0.98))",
              borderColor: authError ? "rgba(239, 68, 68, 0.5)" : "rgba(61, 242, 224, 0.3)",
              boxShadow: authError
                ? "0 0 40px rgba(239, 68, 68, 0.15), inset 0 0 60px rgba(239, 68, 68, 0.03)"
                : "0 0 40px rgba(61, 242, 224, 0.1), inset 0 0 60px rgba(61, 242, 224, 0.02)",
            }}
          >
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(61, 242, 224, 0.5) 2px, rgba(61, 242, 224, 0.5) 4px)" }}
            />

            {/* Warning icon */}
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(239, 167, 52, 0.1)",
                  border: "2px solid rgba(239, 167, 52, 0.4)",
                  boxShadow: "0 0 20px rgba(239, 167, 52, 0.1)",
                }}
              >
                <span className="text-2xl">⚠</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-sm font-mono font-bold text-center tracking-widest mb-1" style={{ color: "#EFA734" }}>
              AUTHORIZATION REQUIRED
            </h2>
            <p className="text-[10px] font-mono text-center mb-4 leading-relaxed" style={{ color: "#3D5253" }}>
              DIETER Security Brain is for penetration testing on systems you<br/>
              own or have explicit written permission to test.<br/>
              Unauthorised scanning is illegal.
            </p>

            {/* Scan details */}
            <div
              className="rounded-lg p-3 mb-4"
              style={{ background: "rgba(61, 242, 224, 0.04)", border: "1px solid rgba(61, 82, 83, 0.2)" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "#3D5253" }}>Tool</span>
                <span className="text-xs font-mono font-bold" style={{ color: "#3DF2E0" }}>{selectedTool.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "#3D5253" }}>Target</span>
                <span className="text-xs font-mono font-bold" style={{ color: "#4CC9F0" }}>{target}</span>
              </div>
            </div>

            {/* Password input */}
            <div className="mb-4">
              <label className="text-[10px] font-mono uppercase tracking-wider block mb-1.5" style={{ color: "#3D5253" }}>
                Access Code
              </label>
              <input
                ref={authInputRef}
                type="password"
                value={authPassword}
                onChange={(e) => { setAuthPassword(e.target.value); setAuthError(false); }}
                onKeyDown={handleAuthKeyDown}
                placeholder="Enter authorization code"
                className="w-full px-4 py-3 rounded-lg font-mono text-sm outline-none transition-all"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: `1px solid ${authError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(61, 82, 83, 0.3)'}`,
                  color: "#3DF2E0",
                  caretColor: "#3DF2E0",
                  letterSpacing: "0.15em",
                }}
                data-testid="input-auth-password"
              />
              {authError && (
                <p className="text-[10px] font-mono mt-1.5 flex items-center gap-1" style={{ color: "#ef4444" }}>
                  <span>✗</span> ACCESS DENIED — Invalid authorization code
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAuthPopup(false); setAuthPassword(""); setAuthError(false); }}
                className="flex-1 px-4 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300"
                style={{
                  background: "rgba(61, 82, 83, 0.1)",
                  border: "1px solid rgba(61, 82, 83, 0.3)",
                  color: "#3D5253",
                }}
                data-testid="button-auth-cancel"
              >
                ABORT
              </button>
              <button
                onClick={handleAuthSubmit}
                disabled={!authPassword.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, rgba(61, 242, 224, 0.15), rgba(76, 201, 240, 0.15))",
                  border: "1px solid rgba(61, 242, 224, 0.4)",
                  color: "#3DF2E0",
                  boxShadow: "0 0 15px rgba(61, 242, 224, 0.1)",
                }}
                data-testid="button-auth-confirm"
              >
                AUTHORIZE & EXECUTE
              </button>
            </div>

            {/* Legal footer */}
            <p className="text-[9px] font-mono text-center mt-4 leading-relaxed" style={{ color: "rgba(61, 82, 83, 0.5)" }}>
              All scan operations are logged to DIETER-IDS with full audit trail.
              Obtain scope agreements before engagements.
            </p>
          </div>
        </div>
      )}

      {/* Output Terminal */}
      {activeOutput && (
        <Card
          className="border"
          style={{ background: "rgba(11, 15, 20, 0.8)", borderColor: "rgba(61, 242, 224, 0.2)", backdropFilter: "blur(10px)" }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold" style={{ color: "#3DF2E0" }}>
                  {activeOutput.tool.toUpperCase()} OUTPUT
                </span>
                <Badge variant="outline" className="text-[9px] font-mono" style={{
                  color: activeOutput.status === "completed" ? "#3DF2E0" : "#4CC9F0",
                  borderColor: activeOutput.status === "completed" ? "rgba(61, 242, 224, 0.3)" : "rgba(76, 201, 240, 0.3)",
                }}>
                  {activeOutput.status}
                </Badge>
              </div>
              <button
                onClick={() => setActiveOutput(null)}
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ color: "#3D5253" }}
              >
                CLOSE
              </button>
            </div>
            <pre
              className="font-mono text-xs whitespace-pre-wrap overflow-y-auto max-h-80 p-3 rounded-md"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                color: "rgba(205, 204, 202, 0.8)",
                border: "1px solid rgba(61, 82, 83, 0.15)",
              }}
            >
              {activeOutput.output || "Waiting for output..."}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      <div>
        <h2 className="text-sm font-mono font-semibold tracking-wider mb-3" style={{ color: "#4CC9F0" }}>
          SCAN HISTORY
        </h2>
        <div className="space-y-2">
          {displayScans.length === 0 && !isLoading && (
            <p className="text-xs font-mono text-center py-8" style={{ color: "#3D5253" }}>
              No scans yet. Select a tool and target above.
            </p>
          )}
          {displayScans.map((scan: ScanJob) => (
            <button
              key={scan.id}
              onClick={() => setActiveOutput(scan)}
              className="w-full text-left p-3 rounded-lg border transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: "rgba(11, 15, 20, 0.5)",
                borderColor: scan.status === "completed" ? "rgba(61, 242, 224, 0.15)" : scan.status === "running" ? "rgba(76, 201, 240, 0.2)" : "rgba(239, 68, 68, 0.15)",
              }}
              data-testid={`card-scan-${scan.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${scan.status === "running" ? "animate-pulse" : ""}`}
                    style={{
                      background: scan.status === "completed" ? "#3DF2E0" : scan.status === "running" ? "#4CC9F0" : scan.status === "failed" ? "#ef4444" : "#3D5253",
                      boxShadow: scan.status === "running" ? "0 0 8px #4CC9F0" : "none",
                    }}
                  />
                  <span className="text-xs font-mono font-semibold" style={{ color: "rgba(205, 204, 202, 0.8)" }}>
                    {scan.tool.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono" style={{ color: "#3D5253" }}>→</span>
                  <span className="text-xs font-mono" style={{ color: "#4CC9F0" }}>{scan.target}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-mono uppercase" style={{
                    color: scan.status === "completed" ? "#3DF2E0" : scan.status === "running" ? "#4CC9F0" : "#ef4444",
                    borderColor: scan.status === "completed" ? "rgba(61, 242, 224, 0.3)" : scan.status === "running" ? "rgba(76, 201, 240, 0.3)" : "rgba(239, 68, 68, 0.3)",
                  }}>
                    {scan.status}
                  </Badge>
                  <span className="text-[10px] font-mono" style={{ color: "#3D5253" }}>
                    {new Date(scan.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Shake animation keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
