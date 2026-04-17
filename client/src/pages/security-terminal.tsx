import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScanJob } from "@shared/schema";

const TOOLS = [
  { id: "nmap", label: "Nmap", desc: "Network discovery & port scanning", icon: "🔍" },
  { id: "nikto", label: "Nikto", desc: "Web server vulnerability scanner", icon: "🕷" },
  { id: "golismero", label: "Golismero", desc: "Orchestrated security testing", icon: "🎯" },
  { id: "bdfproxy", label: "BDFProxy", desc: "Traffic interception & analysis", icon: "📡" },
];

export default function SecurityTerminal() {
  const [selectedTool, setSelectedTool] = useState("nmap");
  const [target, setTarget] = useState("");
  const [activeOutput, setActiveOutput] = useState<ScanJob | null>(null);

  const { data: scans = [], isLoading } = useQuery<ScanJob[]>({
    queryKey: ["/api/scans"],
    refetchInterval: 3000,
  });

  const runScan = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/scans", {
        tool: selectedTool,
        target,
        status: "queued",
        createdAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      setTarget("");
    },
  });

  // Poll for active scan output
  const activeScan = scans.find(s => s.status === "running");

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
                data-testid="input-target"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => runScan.mutate()}
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
          {scans.length === 0 && !isLoading && (
            <p className="text-xs font-mono text-center py-8" style={{ color: "#3D5253" }}>
              No scans yet. Select a tool and target above.
            </p>
          )}
          {scans.map((scan: ScanJob) => (
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
    </div>
  );
}
