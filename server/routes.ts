import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScanJobSchema, insertChatMessageSchema, insertSystemLogSchema } from "@shared/schema";

const VALID_PASSWORD = "Pielanie420";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth check
  app.post("/api/auth/verify", (req, res) => {
    const { password } = req.body;
    if (password === VALID_PASSWORD) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Access denied" });
    }
  });

  // ── Scan Jobs ──
  app.get("/api/scans", async (_req, res) => {
    const jobs = await storage.getScanJobs();
    res.json(jobs);
  });

  app.get("/api/scans/:id", async (req, res) => {
    const job = await storage.getScanJob(Number(req.params.id));
    if (!job) return res.status(404).json({ error: "Not found" });
    res.json(job);
  });

  app.post("/api/scans", async (req, res) => {
    const parsed = insertScanJobSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const job = await storage.createScanJob(parsed.data);
    // Log it
    await storage.createSystemLog({
      level: "info",
      source: job.tool,
      message: `Scan started: ${job.tool} → ${job.target}`,
      createdAt: new Date().toISOString(),
    });
    // Simulate scan execution
    setTimeout(async () => {
      const outputs: Record<string, string> = {
        nmap: generateNmapOutput(job.target),
        nikto: generateNiktoOutput(job.target),
        golismero: generateGolismeroOutput(job.target),
        bdfproxy: generateBdfproxyOutput(job.target),
      };
      await storage.updateScanJob(job.id, {
        status: "completed",
        output: outputs[job.tool] || "Scan completed.",
        completedAt: new Date().toISOString(),
      });
      await storage.createSystemLog({
        level: "info",
        source: job.tool,
        message: `Scan completed: ${job.tool} → ${job.target}`,
        createdAt: new Date().toISOString(),
      });
    }, 3000 + Math.random() * 4000);

    // Update status to running
    await storage.updateScanJob(job.id, { status: "running" });
    res.json(job);
  });

  // ── Chat Messages ──
  app.get("/api/chat", async (_req, res) => {
    const messages = await storage.getChatMessages();
    res.json(messages);
  });

  app.post("/api/chat", async (req, res) => {
    const parsed = insertChatMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const msg = await storage.createChatMessage(parsed.data);

    // Generate AI response
    if (msg.role === "user") {
      const response = generateDieterResponse(msg.content);
      const aiMsg = await storage.createChatMessage({
        role: "assistant",
        content: response,
        createdAt: new Date().toISOString(),
      });
      res.json([msg, aiMsg]);
      return;
    }
    res.json([msg]);
  });

  app.delete("/api/chat", async (_req, res) => {
    await storage.clearChat();
    res.json({ success: true });
  });

  // ── System Logs ──
  app.get("/api/logs", async (req, res) => {
    const limit = Number(req.query.limit) || 100;
    const logs = await storage.getSystemLogs(limit);
    res.json(logs);
  });

  // ── Services ──
  app.get("/api/services", async (_req, res) => {
    const svcs = await storage.getServices();
    if (svcs.length === 0) {
      // Seed default services
      const defaults = [
        { name: "Ollama", status: "online", port: 11434, lastChecked: new Date().toISOString() },
        { name: "Open WebUI", status: "online", port: 3000, lastChecked: new Date().toISOString() },
        { name: "n8n", status: "online", port: 5678, lastChecked: new Date().toISOString() },
        { name: "Qdrant", status: "online", port: 6333, lastChecked: new Date().toISOString() },
        { name: "PostgreSQL", status: "online", port: 5432, lastChecked: new Date().toISOString() },
        { name: "Nmap", status: "online", port: null, lastChecked: new Date().toISOString() },
        { name: "Nikto", status: "online", port: null, lastChecked: new Date().toISOString() },
        { name: "Golismero", status: "degraded", port: null, lastChecked: new Date().toISOString() },
        { name: "BDFProxy", status: "offline", port: null, lastChecked: new Date().toISOString() },
        { name: "OpenJarvis", status: "online", port: 8080, lastChecked: new Date().toISOString() },
        { name: "OpenClaw", status: "online", port: 9090, lastChecked: new Date().toISOString() },
      ];
      const seeded = [];
      for (const d of defaults) {
        seeded.push(await storage.upsertService(d));
      }
      return res.json(seeded);
    }
    res.json(svcs);
  });

  // ── Dashboard stats ──
  app.get("/api/dashboard/stats", async (_req, res) => {
    const scans = await storage.getScanJobs();
    const logs = await storage.getSystemLogs(500);
    const svcs = await storage.getServices();
    res.json({
      totalScans: scans.length,
      activeScans: scans.filter(s => s.status === "running").length,
      completedScans: scans.filter(s => s.status === "completed").length,
      failedScans: scans.filter(s => s.status === "failed").length,
      servicesOnline: svcs.filter(s => s.status === "online").length,
      servicesTotal: svcs.length,
      criticalAlerts: logs.filter(l => l.level === "critical").length,
      recentLogs: logs.slice(0, 20),
    });
  });

  // ── Neural Search ──
  app.post("/api/search", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });
    const results = generateSearchResults(query);
    await storage.createSystemLog({
      level: "info",
      source: "neural-search",
      message: `Search: "${query}" → ${results.length} results`,
      createdAt: new Date().toISOString(),
    });
    res.json({ query, results, reasoning: generateSearchReasoning(query) });
  });

  return httpServer;
}

// ── Simulated tool outputs ──
function generateNmapOutput(target: string): string {
  return `Starting Nmap 7.94SVN ( https://nmap.org )
Nmap scan report for ${target}
Host is up (0.0012s latency).
Not shown: 993 closed tcp ports (reset)
PORT     STATE    SERVICE     VERSION
22/tcp   open     ssh         OpenSSH 8.9p1 Ubuntu 3ubuntu0.6
53/tcp   open     domain      ISC BIND 9.18.18
80/tcp   open     http        nginx 1.24.0
443/tcp  open     ssl/http    nginx 1.24.0
3306/tcp filtered mysql
5432/tcp open     postgresql  PostgreSQL 15.4
8080/tcp open     http-proxy  Node.js Express 4.x

Service detection performed. 7 services detected.
Nmap done: 1 IP address (1 host up) scanned in 12.84 seconds
OS detection: Linux 5.15+ (Ubuntu 22.04)
TRACEROUTE (using port 80/tcp)
HOP RTT     ADDRESS
1   0.45ms  gateway (192.168.1.1)
2   1.12ms  ${target}

[DIETER-IDS] Scan fingerprint stored. No anomalies detected.`;
}

function generateNiktoOutput(target: string): string {
  return `- Nikto v2.5.0
---------------------------------------------------------------------------
+ Target IP:          ${target}
+ Target Hostname:    ${target}
+ Target Port:        80
+ Start Time:         ${new Date().toISOString()}
---------------------------------------------------------------------------
+ Server: nginx/1.24.0
+ /: The anti-clickjacking X-Frame-Options header is not present.
+ /: The X-Content-Type-Options header is not set. Prevents MIME-sniffing.
+ /: Cookie session created without the httponly flag.
+ /robots.txt: contains 3 entries which should be manually viewed.
+ /admin/: Directory indexing found.
+ /api/config: Configuration endpoint exposed.
+ OSVDB-3092: /sitemap.xml: Sitemap found.
+ /login: Default credentials may exist (admin/admin).
+ 8 host(s) tested

[DIETER-IDS] 3 medium vulnerabilities flagged. Review recommended.`;
}

function generateGolismeroOutput(target: string): string {
  return `GoLismero Report — ${target}
═══════════════════════════════════════
[*] Audit started: ${new Date().toISOString()}
[*] Importing Nmap results...
[*] Running DNS bruteforce...
[*] Running web spider...
[+] Found 14 URLs
[+] Found 3 subdomains
[!] Potential SQL injection at /api/search?q=
[!] XSS vulnerability at /comment endpoint
[!] Open redirect at /redirect?url=
[*] Risk Score: 6.4 / 10 (Medium)
[*] Full report generated.

[DIETER-IDS] Golismero audit complete. 3 high-priority findings.`;
}

function generateBdfproxyOutput(target: string): string {
  return `BDFProxy Traffic Intercept — ${target}
═══════════════════════════════════════
[*] ARP spoofing initialized
[*] Intercepting HTTP traffic on interface eth0
[*] Target: ${target}
[*] Gateway: 192.168.1.1
[+] Captured 47 HTTP requests
[+] Captured 12 HTTPS handshakes
[+] Detected 3 unencrypted credential transmissions
[!] Binary patching module: STANDBY (requires explicit authorization)
[*] Session log saved.

[DIETER-IDS] Traffic analysis complete. 3 credential exposure events.`;
}

function generateDieterResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("scan") || lower.includes("nmap")) {
    return "DIETER Security Brain ready. To initiate a scan, navigate to the Security Terminal and select your tool (Nmap/Nikto/Golismero/BDFProxy). Specify the target IP or domain. I'll orchestrate the scan pipeline and correlate results across all tools for a unified threat assessment.";
  }
  if (lower.includes("search") || lower.includes("find")) {
    return "Neural Search Engine engaged. I can search across your indexed documents, scan results, system logs, and external intelligence feeds. My decision layer uses multi-hop reasoning — I don't just retrieve, I correlate patterns across data sources to surface the most actionable intelligence.";
  }
  if (lower.includes("status") || lower.includes("health")) {
    return "All core systems reporting nominal. Ollama inference engine: ONLINE. Vector database (Qdrant): ONLINE. Workflow engine (n8n): ONLINE. Security tools: 3/4 ONLINE (BDFProxy requires explicit activation). Neural search: READY. Memory subsystem: ACTIVE with full context retention.";
  }
  if (lower.includes("help") || lower.includes("what can")) {
    return "I am DIETER — your Neural Security Hub. My capabilities:\n\n• Security Scanning: Nmap, Nikto, Golismero, BDFProxy integration\n• AI Inference: Local LLM via Ollama with RAG document retrieval\n• Workflow Automation: n8n with 400+ integrations\n• Neural Search: Multi-hop reasoning across all data sources\n• Agent System: OpenJarvis + OpenClaw skill orchestration\n• Traffic Analysis: Real-time packet inspection and anomaly detection\n\nI operate under your rules. All data stays private. What's the mission, Commander?";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Commander Danté. DIETER Neural Security Brain v6.1 reporting for duty. All systems nominal. Encryption: AES-256-GCM. Zero Trust: ACTIVE. What's the objective?";
  }
  return `Processing your request through the neural decision layer...\n\nAnalysis: "${input}"\n\nI've indexed this across my knowledge base. The decision engine recommends correlating this with recent scan data and system logs for a comprehensive response. Use the Security Terminal for active reconnaissance or the Neural Search for intelligence gathering.\n\nAll operations logged. Your move, Commander.`;
}

function generateSearchResults(query: string): Array<{title: string, source: string, relevance: number, summary: string}> {
  return [
    { title: `Scan Intelligence: ${query}`, source: "DIETER Scan DB", relevance: 0.94, summary: `Correlated findings from recent security scans matching "${query}". Cross-referenced with NIST vulnerability database.` },
    { title: `System Log Analysis: ${query}`, source: "DIETER Logs", relevance: 0.87, summary: `${Math.floor(Math.random() * 50 + 10)} log entries matched. Pattern analysis suggests recurring activity windows.` },
    { title: `Network Intelligence: ${query}`, source: "Neural Index", relevance: 0.82, summary: `Multi-hop reasoning across network topology data. 3 potential correlation paths identified.` },
    { title: `Threat Feed: ${query}`, source: "External Intel", relevance: 0.75, summary: `Matched against known threat indicators. No active CVEs detected for current configuration.` },
  ];
}

function generateSearchReasoning(query: string): string {
  return `Neural Decision Layer — Multi-hop Reasoning Chain:
1. Query decomposition: "${query}" → [primary intent] + [context signals]
2. Source ranking: Scan DB (0.94) → Logs (0.87) → Neural Index (0.82) → External (0.75)
3. Cross-correlation: Checked scan results against log patterns — no conflicting signals
4. Confidence: HIGH (0.91) — sufficient data density for reliable assessment
5. Recommendation: Review top 2 results for actionable intelligence`;
}
