import { useState, useRef, useEffect } from "react";
import spaceNebulaUrl from "@assets/space-nebula.jpg";

interface PasswordGateProps {
  onAuthenticated: () => void;
}

const BOOT_LINES = [
  "[BIOS] DIETER AI Neural Security Brain v6.1 — POST OK",
  "[CRYPTO] AES-256-GCM encryption engine... LOADED",
  "[FIREWALL] Anti-intrusion defense matrix... ARMED",
  "[IDS] 847,291 threat signatures... INDEXED",
  "[ML] Anomaly detection neural net... ONLINE",
  "[ZERO-TRUST] Micro-segmentation... ACTIVE",
  "[VECTOR-DB] Qdrant semantic index... CONNECTED",
  "[LLM] Ollama inference engine... READY",
  "[N8N] Workflow automation... 400+ integrations LOADED",
  "[JARVIS] OpenJarvis agent system... LINKED",
  "[CLAW] OpenClaw plugin SDK... REGISTERED",
  "[SCAN] Nmap / Nikto / Golismero / BDFProxy... STANDBY",
  "",
  "⚠ AUTHORISED ACCESS ONLY ⚠",
  "DIETER Security Brain is for penetration testing on systems",
  "you own or have explicit written permission to test.",
  "Unauthorised scanning is illegal.",
  "",
  "AWAITING AUTHENTICATION...",
];

export default function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [bootComplete, setBootComplete] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        const currentLine = BOOT_LINES[i];
        setBootLines(prev => [...prev, currentLine]);
        i++;
        if (bootRef.current) {
          bootRef.current.scrollTop = bootRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setBootComplete(true);
          setShowGlow(true);
          setTimeout(() => inputRef.current?.focus(), 300);
        }, 400);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setShowGlow(false);
        setTimeout(onAuthenticated, 600);
      } else {
        setError("ACCESS DENIED — Invalid credentials");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPassword("");
      }
    } catch {
      setError("CONNECTION FAILED — System unreachable");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Space nebula background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${spaceNebulaUrl})`,
          filter: "brightness(0.25) saturate(0.7)",
        }}
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14]/90 via-[#0B0F14]/70 to-[#0B0F14]/95" />

      {/* Animated grid */}
      <div className="absolute inset-0 dieter-grid-bg opacity-30" />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-[2px] opacity-20"
          style={{
            background: "linear-gradient(90deg, transparent, #3DF2E0, transparent)",
            animation: "scan-line 6s linear infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl px-6">
        {/* DIETER Logo */}
        <div className="text-center mb-8">
          <svg viewBox="0 0 200 40" className="mx-auto w-64 mb-2" aria-label="DIETER">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3DF2E0" />
                <stop offset="50%" stopColor="#4CC9F0" />
                <stop offset="100%" stopColor="#3DF2E0" />
              </linearGradient>
            </defs>
            <text
              x="100" y="30"
              textAnchor="middle"
              fill="url(#logo-grad)"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="32"
              fontWeight="700"
              letterSpacing="8"
            >
              DIETER
            </text>
          </svg>
          <p className="text-xs tracking-[0.3em] uppercase" style={{ color: "#3D5253" }}>
            Neural Security Hub v6.1
          </p>
        </div>

        {/* Boot Terminal */}
        <div
          ref={bootRef}
          className="rounded-lg border p-4 mb-6 font-mono text-xs overflow-y-auto max-h-64 transition-all duration-500"
          style={{
            background: "rgba(11, 15, 20, 0.85)",
            borderColor: bootComplete ? "rgba(61, 242, 224, 0.3)" : "rgba(61, 82, 83, 0.3)",
            backdropFilter: "blur(20px)",
          }}
        >
          {bootLines.map((line, i) => (
            <div
              key={i}
              className="leading-relaxed"
              style={{
                color: line.startsWith("⚠")
                  ? "#f59e0b"
                  : line.includes("LOADED") || line.includes("ONLINE") || line.includes("READY") || line.includes("ACTIVE") || line.includes("ARMED") || line.includes("INDEXED") || line.includes("CONNECTED") || line.includes("LINKED") || line.includes("REGISTERED") || line.includes("STANDBY")
                    ? "#3DF2E0"
                    : line.includes("AUTHORISED") || line.includes("illegal")
                      ? "#ef4444"
                      : line.includes("AWAITING")
                        ? "#4CC9F0"
                        : "rgba(205, 204, 202, 0.7)",
              }}
            >
              {line}
            </div>
          ))}
          {!bootComplete && (
            <span className="inline-block w-2 h-4 ml-1 animate-pulse" style={{ background: "#3DF2E0" }} />
          )}
        </div>

        {/* Password Form */}
        <div
          className={`transition-all duration-700 ${bootComplete ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#3DF2E0", boxShadow: "0 0 8px #3DF2E0" }}
                />
                <span className="text-xs font-mono tracking-wider" style={{ color: "#4CC9F0" }}>
                  IDENTITY VERIFICATION REQUIRED
                </span>
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#3DF2E0", boxShadow: "0 0 8px #3DF2E0" }}
                />
              </div>
            </div>

            <div className={`relative ${shake ? "animate-shake" : ""}`}
              style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
            >
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access code..."
                className="w-full px-4 py-3 rounded-lg font-mono text-sm outline-none transition-all duration-300 gate-input"
                style={{
                  background: "rgba(11, 15, 20, 0.8)",
                  border: `1px solid ${error ? "rgba(239, 68, 68, 0.5)" : showGlow ? "rgba(61, 242, 224, 0.3)" : "rgba(61, 82, 83, 0.3)"}`,
                  color: "#3DF2E0",
                  caretColor: "#3DF2E0",
                  backdropFilter: "blur(20px)",
                }}
                data-testid="input-password"
                autoComplete="off"
              />
              {/* Glow border animation */}
              {showGlow && (
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    boxShadow: "0 0 15px rgba(61, 242, 224, 0.1), inset 0 0 15px rgba(61, 242, 224, 0.05)",
                  }}
                />
              )}
            </div>

            {error && (
              <p className="text-xs font-mono text-center" style={{ color: "#ef4444" }} data-testid="text-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="w-full py-3 rounded-lg font-mono text-sm font-semibold tracking-wider uppercase transition-all duration-300 disabled:opacity-40"
              style={{
                background: isVerifying
                  ? "rgba(61, 242, 224, 0.1)"
                  : "linear-gradient(135deg, rgba(61, 242, 224, 0.15), rgba(76, 201, 240, 0.15))",
                border: "1px solid rgba(61, 242, 224, 0.3)",
                color: "#3DF2E0",
              }}
              onMouseEnter={(e) => {
                if (!isVerifying) e.currentTarget.style.background = "linear-gradient(135deg, rgba(61, 242, 224, 0.25), rgba(76, 201, 240, 0.25))";
              }}
              onMouseLeave={(e) => {
                if (!isVerifying) e.currentTarget.style.background = "linear-gradient(135deg, rgba(61, 242, 224, 0.15), rgba(76, 201, 240, 0.15))";
              }}
              data-testid="button-authenticate"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "#3DF2E0 transparent transparent transparent" }} />
                  VERIFYING...
                </span>
              ) : (
                "AUTHENTICATE"
              )}
            </button>
          </form>

          <p className="text-center mt-4 text-xs font-mono" style={{ color: "rgba(61, 82, 83, 0.6)" }}>
            Transparent Programs & Design — Authorised Personnel Only
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
