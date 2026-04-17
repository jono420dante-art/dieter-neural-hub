import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import spaceBlueprintUrl from "@assets/space-blueprint.jpg";
import type { Service, SystemLog } from "@shared/schema";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  return (
    <div className="space-y-6 relative">
      {/* Hero banner with space blueprint */}
      <div className="relative rounded-lg overflow-hidden h-44" data-testid="card-hero">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${spaceBlueprintUrl})`,
            filter: "brightness(0.3) saturate(0.5)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F14]/90 via-[#0B0F14]/60 to-transparent" />
        <div className="absolute inset-0 dieter-grid-bg opacity-20" />
        <div className="relative z-10 p-6 h-full flex flex-col justify-center">
          <h1 className="text-xl font-bold tracking-wider" style={{ color: "#3DF2E0" }}>
            DIETER COMMAND CENTER
          </h1>
          <p className="text-xs font-mono mt-1" style={{ color: "#4CC9F0" }}>
            Neural Security Hub v6.1 — All Systems Operational
          </p>
          <div className="flex gap-4 mt-4">
            <StatPill label="SCANS" value={stats?.totalScans ?? 0} color="#3DF2E0" />
            <StatPill label="ACTIVE" value={stats?.activeScans ?? 0} color="#4CC9F0" />
            <StatPill label="SERVICES" value={`${stats?.servicesOnline ?? 0}/${stats?.servicesTotal ?? 0}`} color="#3DF2E0" />
            <StatPill label="ALERTS" value={stats?.criticalAlerts ?? 0} color={stats?.criticalAlerts > 0 ? "#ef4444" : "#3DF2E0"} />
          </div>
        </div>
      </div>

      {/* Service Grid */}
      <div>
        <h2 className="text-sm font-mono font-semibold tracking-wider mb-3" style={{ color: "#4CC9F0" }}>
          SYSTEM SERVICES
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {services.map((svc: Service) => (
            <Card
              key={svc.id}
              className="border transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "rgba(11, 15, 20, 0.6)",
                borderColor: svc.status === "online" ? "rgba(61, 242, 224, 0.2)" : svc.status === "degraded" ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)",
                backdropFilter: "blur(10px)",
              }}
              data-testid={`card-service-${svc.id}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold truncate" style={{ color: "rgba(205, 204, 202, 0.9)" }}>
                    {svc.name}
                  </span>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: svc.status === "online" ? "#3DF2E0" : svc.status === "degraded" ? "#f59e0b" : "#ef4444",
                      boxShadow: `0 0 6px ${svc.status === "online" ? "#3DF2E0" : svc.status === "degraded" ? "#f59e0b" : "#ef4444"}`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono" style={{ color: "#3D5253" }}>
                    {svc.port ? `:${svc.port}` : "CLI"}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 font-mono uppercase"
                    style={{
                      color: svc.status === "online" ? "#3DF2E0" : svc.status === "degraded" ? "#f59e0b" : "#ef4444",
                      borderColor: svc.status === "online" ? "rgba(61, 242, 224, 0.3)" : svc.status === "degraded" ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    {svc.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-sm font-mono font-semibold tracking-wider mb-3" style={{ color: "#4CC9F0" }}>
          ACTIVITY LOG
        </h2>
        <Card
          className="border"
          style={{
            background: "rgba(11, 15, 20, 0.6)",
            borderColor: "rgba(61, 82, 83, 0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <CardContent className="p-4 max-h-64 overflow-y-auto">
            {stats?.recentLogs?.length > 0 ? (
              <div className="space-y-1">
                {stats.recentLogs.map((log: SystemLog) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs font-mono py-1 border-b" style={{ borderColor: "rgba(61, 82, 83, 0.1)" }}>
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold flex-shrink-0"
                      style={{
                        background: log.level === "critical" ? "rgba(239, 68, 68, 0.2)" : log.level === "warn" ? "rgba(245, 158, 11, 0.2)" : "rgba(61, 242, 224, 0.1)",
                        color: log.level === "critical" ? "#ef4444" : log.level === "warn" ? "#f59e0b" : "#3DF2E0",
                      }}
                    >
                      {log.level}
                    </span>
                    <span style={{ color: "#3D5253" }} className="flex-shrink-0">[{log.source}]</span>
                    <span style={{ color: "rgba(205, 204, 202, 0.7)" }} className="truncate">{log.message}</span>
                    <span style={{ color: "#3D5253" }} className="flex-shrink-0 ml-auto text-[10px]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-center py-8" style={{ color: "#3D5253" }}>
                No activity yet. Run a scan or send a message to generate logs.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Architecture Map */}
      <div>
        <h2 className="text-sm font-mono font-semibold tracking-wider mb-3" style={{ color: "#4CC9F0" }}>
          ARCHITECTURE
        </h2>
        <Card
          className="border"
          style={{
            background: "rgba(11, 15, 20, 0.6)",
            borderColor: "rgba(61, 82, 83, 0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <ArchNode label="Open WebUI" sublabel="Chat Interface" port="3000" />
              <ArchNode label="n8n" sublabel="Workflow Engine" port="5678" />
              <ArchNode label="Ollama" sublabel="LLM Inference" port="11434" />
              <ArchNode label="Qdrant" sublabel="Vector DB" port="6333" />
              <ArchNode label="PostgreSQL" sublabel="Data Store" port="5432" />
              <ArchNode label="OpenJarvis" sublabel="Agent System" port="8080" />
              <ArchNode label="Nmap" sublabel="Port Scanner" port="CLI" />
              <ArchNode label="Nikto" sublabel="Web Vuln" port="CLI" />
              <ArchNode label="Golismero" sublabel="Orchestrator" port="CLI" />
            </div>
            <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid rgba(61, 82, 83, 0.2)" }}>
              <span className="text-[10px] font-mono" style={{ color: "#3D5253" }}>
                All services on Docker network: dieter-network — Zero Trust micro-segmentation active
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      className="px-3 py-1.5 rounded-md font-mono text-xs"
      style={{
        background: "rgba(11, 15, 20, 0.6)",
        border: `1px solid ${color}33`,
        backdropFilter: "blur(10px)",
      }}
    >
      <span style={{ color: color }} className="font-bold">{value}</span>
      <span style={{ color: "#3D5253" }} className="ml-1.5 text-[10px]">{label}</span>
    </div>
  );
}

function ArchNode({ label, sublabel, port }: { label: string; sublabel: string; port: string }) {
  return (
    <div
      className="p-2.5 rounded-lg border transition-all duration-300 hover:scale-105"
      style={{
        background: "rgba(11, 15, 20, 0.5)",
        borderColor: "rgba(61, 242, 224, 0.15)",
      }}
    >
      <div className="text-xs font-mono font-semibold" style={{ color: "#3DF2E0" }}>{label}</div>
      <div className="text-[10px] font-mono" style={{ color: "#3D5253" }}>{sublabel}</div>
      <div className="text-[9px] font-mono mt-0.5" style={{ color: "rgba(76, 201, 240, 0.5)" }}>:{port}</div>
    </div>
  );
}
