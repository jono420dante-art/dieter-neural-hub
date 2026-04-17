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

// ── Randomization Helpers ──
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rttMs(): string { return (Math.random() * 2 + 0.1).toFixed(2); }

// ── Simulated tool outputs ──
function generateNmapOutput(target: string): string {
  const latency = (Math.random() * 0.01 + 0.0005).toFixed(4);
  const closedPorts = rand(985, 997);
  const scanTime = (Math.random() * 20 + 5).toFixed(2);
  const os = pick([
    "Linux 5.15+ (Ubuntu 22.04)", "Linux 6.1+ (Debian 12)",
    "FreeBSD 13.2", "Windows Server 2022", "Linux 5.4 (CentOS 8)"
  ]);
  const sshVer = pick(["OpenSSH 8.9p1 Ubuntu 3ubuntu0.6", "OpenSSH 9.3p1 Debian 1", "OpenSSH 8.4p1 Debian 5+deb11u2"]);
  const webServer = pick(["nginx 1.24.0", "nginx 1.25.3", "Apache/2.4.58", "Apache/2.4.52 (Ubuntu)"]);
  const pgVer = pick(["PostgreSQL 15.4", "PostgreSQL 16.1", "PostgreSQL 14.10"]);
  const extraPorts = pick([
    "6379/tcp open     redis       Redis 7.2.3",
    "27017/tcp open    mongodb     MongoDB 7.0.4",
    "9200/tcp open     http        Elasticsearch 8.11",
    "11211/tcp open    memcached   Memcached 1.6.22",
  ]);
  const vulnNote = pick([
    "[DIETER-IDS] Scan fingerprint stored. No anomalies detected.",
    "[DIETER-IDS] ⚠ Port 3306/tcp filtered — possible firewall evasion. Logging event.",
    "[DIETER-IDS] SSH version fingerprint matched known CVE-2023-38408. Recommend patching.",
    "[DIETER-IDS] Multiple open services detected. Attack surface analysis recommended.",
  ]);

  return `Starting Nmap 7.94SVN ( https://nmap.org )
Nmap scan report for ${target}
Host is up (${latency}s latency).
Not shown: ${closedPorts} closed tcp ports (reset)
PORT      STATE    SERVICE     VERSION
22/tcp    open     ssh         ${sshVer}
53/tcp    open     domain      ISC BIND 9.18.18
80/tcp    open     http        ${webServer}
443/tcp   open     ssl/http    ${webServer}
3306/tcp  filtered mysql
5432/tcp  open     postgresql  ${pgVer}
8080/tcp  open     http-proxy  Node.js Express 4.x
${extraPorts}

Aggressive OS guesses: ${os} (98%)
Network Distance: ${rand(1, 4)} hops
Service detection performed. ${rand(7, 10)} services detected.
Nmap done: 1 IP address (1 host up) scanned in ${scanTime} seconds

TRACEROUTE (using port 80/tcp)
HOP  RTT       ADDRESS
1    ${rttMs()}ms   gateway (${target.includes('.') ? target.split('.').slice(0, 3).join('.') + '.1' : '192.168.1.1'})
2    ${rttMs()}ms   ${target}

NSE: Script results:
|_http-title: ${pick(['Welcome', 'Dashboard', 'Login', 'API Gateway', 'Service Portal'])}
|_ssl-cert: Subject: CN=${target}
|_http-server-header: ${webServer}

${vulnNote}`;
}

function generateNiktoOutput(target: string): string {
  const server = pick(["nginx/1.24.0", "nginx/1.25.3", "Apache/2.4.58", "Apache/2.4.52"]);
  const vulnCount = rand(5, 14);
  const findings = [
    "+ /: The anti-clickjacking X-Frame-Options header is not present.",
    "+ /: The X-Content-Type-Options header is not set. Prevents MIME-sniffing.",
    "+ /: Cookie session created without the httponly flag.",
    "+ /robots.txt: contains 3 entries which should be manually viewed.",
    "+ /admin/: Directory indexing found.",
    "+ /api/config: Configuration endpoint exposed — potential secrets leak.",
    "+ OSVDB-3092: /sitemap.xml: Sitemap found.",
    "+ /login: Default credentials may exist (admin/admin).",
    "+ /server-status: Apache server-status page found (mod_status).",
    "+ /phpinfo.php: PHP info page found — version and config exposed.",
    "+ /.env: Environment file accessible — contains database credentials.",
    "+ /api/debug: Debug endpoint returns stack traces with internal paths.",
    "+ /backup/: Backup directory found with .sql dump files.",
    "+ OSVDB-6694: /trace.axd: ASP.NET trace information leak.",
    "+ /wp-admin/: WordPress admin panel detected — check for updates.",
    "+ /api/v1/users: User enumeration possible via sequential IDs.",
  ];
  const selected = findings.sort(() => Math.random() - 0.5).slice(0, vulnCount);
  const severity = vulnCount > 10 ? "HIGH" : vulnCount > 7 ? "MEDIUM" : "LOW";

  return `- Nikto v2.5.0
---------------------------------------------------------------------------
+ Target IP:          ${target}
+ Target Hostname:    ${target}
+ Target Port:        80
+ Start Time:         ${new Date().toISOString()}
+ SSL Info:           Subject: /CN=${target}
---------------------------------------------------------------------------
+ Server: ${server}
${selected.join('\n')}
+ ${rand(1200, 4500)} requests: ${rand(0, 3)} error(s) and ${vulnCount} item(s) reported
+ End Time:           ${new Date().toISOString()} (${rand(25, 90)} seconds)
---------------------------------------------------------------------------

[DIETER-IDS] Severity: ${severity} — ${vulnCount} findings across ${rand(3, 8)} categories.
[DIETER-IDS] ${vulnCount > 8 ? '⚠ CRITICAL: Credential/config exposure detected. Immediate remediation required.' : 'Recommend reviewing flagged endpoints. No critical exposures.'}`;
}

function generateGolismeroOutput(target: string): string {
  const urlCount = rand(8, 30);
  const subdomains = rand(1, 8);
  const riskScore = (Math.random() * 4 + 4).toFixed(1);
  const vulns = [
    "[!] SQL Injection (CRITICAL) at /api/search?q= — parameterized queries not used",
    "[!] Reflected XSS (HIGH) at /comment — user input echoed without sanitization",
    "[!] Open Redirect (MEDIUM) at /redirect?url= — no whitelist validation",
    "[!] CSRF Token Missing (MEDIUM) on /api/settings — state-changing POST without token",
    "[!] Information Disclosure (LOW) at /api/debug — stack traces in 500 responses",
    "[!] Directory Traversal (HIGH) at /api/files?path= — path not sanitized",
    "[!] Insecure Deserialization (CRITICAL) at /api/import — accepts untrusted serialized data",
    "[!] Broken Authentication (HIGH) at /api/admin — no rate limiting on login",
  ];
  const selectedVulns = vulns.sort(() => Math.random() - 0.5).slice(0, rand(3, 6));
  const critCount = selectedVulns.filter(v => v.includes('CRITICAL')).length;
  const highCount = selectedVulns.filter(v => v.includes('HIGH')).length;

  return `GoLismero v2.0 — Orchestrated Security Testing
══════════════════════════════════════════════════
Target: ${target}
Started: ${new Date().toISOString()}
Plugins loaded: Nmap, Nikto, SQLMap, XSSer, DNS bruteforce
══════════════════════════════════════════════════

[*] Phase 1: Reconnaissance
    [+] DNS resolution: ${target} → ${rand(10,200)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}
    [+] Found ${subdomains} subdomains: ${['api','dev','staging','admin','mail','cdn','static'].sort(() => Math.random() - 0.5).slice(0, subdomains).map(s => s + '.' + target).join(', ')}
    [+] Web spider crawled ${urlCount} URLs

[*] Phase 2: Vulnerability Assessment
${selectedVulns.join('\n')}

[*] Phase 3: Risk Assessment
    Overall Risk Score: ${riskScore} / 10 (${parseFloat(riskScore) > 7 ? 'HIGH' : parseFloat(riskScore) > 5 ? 'MEDIUM' : 'LOW'})
    Critical: ${critCount}  |  High: ${highCount}  |  Medium: ${selectedVulns.length - critCount - highCount}  |  Info: ${rand(2, 8)}

[*] Full HTML report exported to: /var/dieter/reports/golismero_${target.replace(/\./g, '_')}.html

[DIETER-IDS] Golismero audit complete. ${selectedVulns.length} findings across ${rand(3, 6)} attack vectors.
[DIETER-IDS] ${critCount > 0 ? '⚠ CRITICAL vulnerabilities detected. Blocking deployment recommendation issued.' : 'No critical findings. Recommend patching HIGH severity items within 48 hours.'}`;
}

function generateBdfproxyOutput(target: string): string {
  const httpReqs = rand(30, 120);
  const httpsHandshakes = rand(8, 40);
  const credEvents = rand(0, 6);
  const duration = rand(30, 180);

  return `BDFProxy v0.3.9 — Binary Defence Framework Proxy
══════════════════════════════════════════════════
Target: ${target}
Interface: eth0
Gateway: ${target.includes('.') ? target.split('.').slice(0, 3).join('.') + '.1' : '192.168.1.1'}
Started: ${new Date().toISOString()}
══════════════════════════════════════════════════

[*] ARP spoofing initialized — gratuitous ARP sent to gateway
[*] MITM position established. Intercepting traffic.
[+] Duration: ${duration}s active capture

── Traffic Summary ──
  HTTP requests captured:      ${httpReqs}
  HTTPS handshakes observed:   ${httpsHandshakes}
  DNS queries intercepted:     ${rand(50, 200)}
  Unique user agents:          ${rand(3, 12)}

── Credential Analysis ──
  Unencrypted auth detected:   ${credEvents}
  ${credEvents > 0 ? `  → POST /login (Basic Auth over HTTP)
  → POST /api/auth (cleartext password field)
  → Cookie: session_id transmitted without Secure flag` : '  No cleartext credentials detected in this capture window.'}

── Binary Analysis ──
  Executables downloaded:       ${rand(0, 4)}
  PE files detected:            ${rand(0, 2)}
  Patch module:                 STANDBY (requires explicit scope authorization)

[*] PCAP saved: /var/dieter/captures/bdfproxy_${target.replace(/\./g, '_')}_${Date.now()}.pcap
[*] Session terminated cleanly. ARP tables restored.

[DIETER-IDS] Traffic analysis complete.
[DIETER-IDS] ${credEvents > 3 ? '⚠ HIGH RISK: Multiple credential exposure events. Enforce HTTPS and HSTS immediately.' : credEvents > 0 ? 'Credential exposure detected. Review HTTP→HTTPS migration for affected endpoints.' : '✓ No credential exposure. Transport security appears adequate.'}`;
}

// ── DIETER AI Brain — Enhanced Response Engine ──
function generateDieterResponse(input: string): string {
  const lower = input.toLowerCase();
  const ts = new Date().toISOString().split('T')[1].split('.')[0];

  // Greetings
  if (/^(hello|hi|hey|yo|sup|what'?s? up)/i.test(lower)) {
    return `Commander Danté. DIETER Neural Security Brain v6.1 reporting for duty.\n\n┌─ System Status ─────────────────────┐\n│ Encryption:  AES-256-GCM    ✓ ARMED │\n│ Zero Trust:  Micro-seg      ✓ ACTIVE│\n│ IDS:         847K sigs      ✓ LOADED│\n│ LLM:         Ollama         ✓ ONLINE│\n│ Vector DB:   Qdrant         ✓ READY │\n└─────────────────────────────────────┘\n\nAll systems operational. What's the objective?`;
  }

  // Help / capabilities
  if (lower.includes("help") || lower.includes("what can") || lower.includes("capabilities") || lower.includes("features")) {
    return `DIETER Neural Security Hub — Capability Matrix\n\n╔══════════════════════════════════════════════════╗\n║  SECURITY LAYER                                  ║\n║  • Nmap — Network discovery & port scanning      ║\n║  • Nikto — Web server vulnerability assessment   ║\n║  • Golismero — Orchestrated multi-tool audits     ║\n║  • BDFProxy — Traffic interception & analysis    ║\n╠══════════════════════════════════════════════════╣\n║  AI LAYER                                        ║\n║  • Ollama — Local LLM inference (no cloud leak)  ║\n║  • Qdrant — Vector DB for RAG document retrieval ║\n║  • Open WebUI — Full chat interface              ║\n║  • n8n — 400+ workflow integrations               ║\n╠══════════════════════════════════════════════════╣\n║  AGENT LAYER                                     ║\n║  • OpenJarvis — Autonomous agent orchestration   ║\n║  • OpenClaw — Plugin SDK for custom skills       ║\n║  • Neural Search — Multi-hop reasoning engine    ║\n╚══════════════════════════════════════════════════╝\n\nAll data stays local. Zero cloud dependency. Your rules, Commander.`;
  }

  // Scans / nmap / nikto / golismero / bdfproxy
  if (lower.includes("scan") || lower.includes("nmap") || lower.includes("nikto") || lower.includes("golismero") || lower.includes("bdfproxy") || lower.includes("pentest") || lower.includes("penetration")) {
    return `Security Terminal standing by.\n\n⚠ AUTHORISED USE ONLY — Scans require explicit written scope agreements.\n\nAvailable tools:\n  1. Nmap    → Network discovery, port scan, OS fingerprinting, NSE scripts\n  2. Nikto   → Web server vulnerabilities, misconfigurations, default creds\n  3. Golismero → Orchestrated audit (chains Nmap + Nikto + SQLMap + XSSer)\n  4. BDFProxy  → MITM traffic intercept, credential capture, binary analysis\n\nNavigate to SECURITY → select tool → enter target → confirm authorization.\nAll scans are logged to DIETER-IDS with full audit trail.`;
  }

  // Status / health / systems
  if (lower.includes("status") || lower.includes("health") || lower.includes("systems") || lower.includes("services")) {
    return `System Health Report — ${ts}\n\n┌─ Core Services ──────────────────────────────────┐\n│ Ollama       :11434   ● ONLINE   LLM inference    │\n│ Open WebUI   :3000    ● ONLINE   Chat interface   │\n│ n8n          :5678    ● ONLINE   Workflow engine   │\n│ Qdrant       :6333    ● ONLINE   Vector database   │\n│ PostgreSQL   :5432    ● ONLINE   Data store        │\n│ OpenJarvis   :8080    ● ONLINE   Agent system      │\n│ OpenClaw     :9090    ● ONLINE   Plugin SDK        │\n├─ Security Tools ─────────────────────────────────┤\n│ Nmap         CLI      ● ONLINE   Port scanner      │\n│ Nikto        CLI      ● ONLINE   Web vuln scanner  │\n│ Golismero    CLI      ◉ DEGRADED Orchestrator       │\n│ BDFProxy     CLI      ○ OFFLINE  Traffic intercept  │\n└──────────────────────────────────────────────────┘\n\n9/11 services operational. BDFProxy requires manual activation with scope authorization.`;
  }

  // Search queries
  if (lower.includes("search") || lower.includes("find") || lower.includes("lookup") || lower.includes("query")) {
    return `Neural Search Engine engaged.\n\nMy decision layer uses multi-hop reasoning across 4 data sources:\n  1. Scan DB     — All historical scan results (Nmap, Nikto, Golismero)\n  2. System Logs — Real-time IDS alerts, auth events, service health\n  3. Neural Index — Qdrant vector embeddings of security documents\n  4. External Intel — CVE feeds, threat indicators, OSINT\n\nI don't just retrieve — I cross-correlate patterns across sources, rank by confidence, and flag contradictions.\n\nNavigate to SEARCH or ask me directly: "search [your query]"`;
  }

  // Threat / vulnerability / CVE
  if (lower.includes("threat") || lower.includes("vuln") || lower.includes("cve") || lower.includes("exploit") || lower.includes("attack")) {
    return `Threat Intelligence Module activated.\n\nCurrent threat landscape assessment:\n  • Zero-day monitoring: Active via external intel feeds\n  • CVE correlation: Cross-referencing scan results against NVD/NIST\n  • Pattern analysis: IDS signatures updated (847,291 active)\n  • Anomaly detection: ML pipeline monitoring network baselines\n\nTo investigate a specific threat:\n  → Run a targeted scan in Security Terminal\n  → Search the Neural Index for historical patterns\n  → Ask me about a specific CVE (e.g., "CVE-2024-3094")\n\nAll intelligence is processed locally. No external data leakage.`;
  }

  // Network / infrastructure
  if (lower.includes("network") || lower.includes("infrastructure") || lower.includes("docker") || lower.includes("architecture")) {
    return `DIETER Architecture — Docker Network Topology\n\n  dieter-network (172.20.0.0/16) — Zero Trust micro-segmentation\n  ├── dieter-hub       :5000  │ Command center + API gateway\n  ├── ollama           :11434 │ LLM inference (GPU-accelerated)\n  ├── open-webui       :3000  │ Chat interface → Ollama\n  ├── n8n              :5678  │ Workflow automation (400+ integrations)\n  ├── qdrant           :6333  │ Vector DB for semantic search\n  ├── postgres         :5432  │ Persistent data store\n  ├── openjarvis       :8080  │ Agent orchestration system\n  ├── openclaw         :9090  │ Plugin SDK runtime\n  └── security-tools   :---   │ Nmap, Nikto, Golismero (CLI)\n\nAll inter-service communication encrypted. External access through DIETER Hub only.`;
  }

  // Ollama / AI / LLM
  if (lower.includes("ollama") || lower.includes("llm") || lower.includes("model") || lower.includes("ai") || lower.includes("intelligence")) {
    return `AI Inference Stack — Local & Private\n\n  Ollama Engine (:11434)\n  ├── Model management: Pull, run, and switch models on-demand\n  ├── GPU acceleration: NVIDIA CUDA / AMD ROCm support\n  ├── Context window: Up to 128K tokens (model-dependent)\n  └── API: OpenAI-compatible — any tool can connect\n\n  Qdrant Vector DB (:6333)\n  ├── RAG pipeline: Document embeddings for knowledge retrieval\n  ├── Semantic search: Cosine similarity across security docs\n  └── Collections: scan_reports, threat_intel, network_topology\n\n  Open WebUI (:3000)\n  └── Full chat interface with document upload, web search, and tool calling\n\nAll inference runs locally. Zero data leaves the network.`;
  }

  // n8n / workflow / automation
  if (lower.includes("n8n") || lower.includes("workflow") || lower.includes("automat")) {
    return `n8n Workflow Engine (:5678) — 400+ Integrations\n\nActive automation capabilities:\n  • Scan scheduling: Cron-triggered Nmap sweeps on defined subnets\n  • Alert pipeline: Severity-based routing → Slack/email/webhook\n  • Report generation: Auto-compile findings into PDF after scan chains\n  • Threat correlation: Cross-reference new CVEs against scan history\n  • Log aggregation: Centralized logging from all DIETER services\n\nAuth: dieter / [protected]\nTimezone: Africa/Johannesburg\n\nWorkflows are version-controlled and exportable.`;
  }

  // Who are you / about DIETER
  if (lower.includes("who are you") || lower.includes("about") || lower.includes("dieter") || lower.includes("what is this")) {
    return `I am DIETER — Neural Security Hub v6.1.\n\nBuilt by Transparent Programs & Design for Commander Danté.\n\nI am a self-hosted, air-gapped security intelligence platform that combines:\n  • Penetration testing tools (Nmap, Nikto, Golismero, BDFProxy)\n  • Local AI inference (Ollama + Qdrant RAG pipeline)\n  • Autonomous agents (OpenJarvis + OpenClaw SDK)\n  • Workflow automation (n8n — 400+ integrations)\n  • Neural search with multi-hop reasoning\n\nEvery byte stays on your infrastructure. No cloud. No telemetry. No compromise.\n\nAuthorised use only. All operations logged.`;
  }

  // Fallback — intelligent contextual response
  return `Processing through neural decision layer...\n\nQuery: "${input}"\nTimestamp: ${ts}\nConfidence: Analyzing...\n\nI've parsed your input against my knowledge domains:\n  1. Security operations → ${lower.includes("port") || lower.includes("ip") || lower.includes("host") ? 'HIGH relevance' : 'No direct match'}\n  2. System administration → ${lower.includes("config") || lower.includes("log") || lower.includes("service") ? 'HIGH relevance' : 'No direct match'}\n  3. Threat intelligence → ${lower.includes("risk") || lower.includes("alert") || lower.includes("breach") ? 'HIGH relevance' : 'No direct match'}\n\nFor the most actionable response, try:\n  • A targeted scan: Navigate to Security Terminal\n  • Intelligence search: Navigate to Neural Search\n  • System check: Ask me "status" or "health"\n\nAll operations logged. Your move, Commander.`;
}

function generateSearchResults(query: string): Array<{title: string, source: string, relevance: number, summary: string}> {
  const lower = query.toLowerCase();
  const baseResults = [
    { title: `Scan Intelligence: ${query}`, source: "DIETER Scan DB", relevance: 0.94, summary: `Correlated findings from recent security scans matching "${query}". Cross-referenced with NIST vulnerability database. ${rand(2,8)} direct matches found across ${rand(1,5)} scan sessions.` },
    { title: `System Log Analysis: ${query}`, source: "DIETER Logs", relevance: 0.87, summary: `${rand(12, 89)} log entries matched. Pattern analysis suggests ${pick(['recurring activity windows', 'anomalous access patterns', 'periodic reconnaissance attempts', 'automated scanning behavior'])}. Time-series clustering applied.` },
    { title: `Network Intelligence: ${query}`, source: "Neural Index", relevance: 0.82, summary: `Multi-hop reasoning across network topology data. ${rand(2,6)} potential correlation paths identified. Qdrant vector similarity: ${(Math.random() * 0.15 + 0.80).toFixed(3)}.` },
    { title: `Threat Feed: ${query}`, source: "External Intel", relevance: 0.75, summary: `Matched against ${rand(3,12)} known threat indicators. ${pick(['No active CVEs detected for current configuration.', 'CVE correlation found — review recommended.', 'Pattern matches MITRE ATT&CK technique T' + rand(1000,1999) + '.', 'OSINT sources indicate similar activity in APT campaigns.'])}` },
  ];

  // Add context-specific results
  if (lower.includes('ssh') || lower.includes('brute')) {
    baseResults.push({ title: `SSH Hardening Report`, source: "DIETER Knowledge Base", relevance: 0.71, summary: `Recommended: Disable password auth, enforce key-based only. Set MaxAuthTries=3. Enable fail2ban with 15-min ban window. Review /etc/ssh/sshd_config.` });
  }
  if (lower.includes('sql') || lower.includes('injection')) {
    baseResults.push({ title: `SQL Injection Prevention Matrix`, source: "DIETER Knowledge Base", relevance: 0.69, summary: `Parameterized queries required on all endpoints. ORM usage detected on ${rand(60,95)}% of routes. Manual review flagged ${rand(1,4)} raw query constructions.` });
  }

  return baseResults;
}

function generateSearchReasoning(query: string): string {
  const confidence = (Math.random() * 0.15 + 0.82).toFixed(2);
  const hops = rand(3, 6);
  return `Neural Decision Layer — Multi-hop Reasoning Chain:\n1. Query decomposition: "${query}" → [primary intent: ${pick(['reconnaissance', 'vulnerability assessment', 'threat hunting', 'compliance check', 'incident response'])}] + [context signals: ${pick(['network scope', 'temporal range', 'severity filter', 'asset classification'])}]\n2. Source ranking: Scan DB (0.94) → Logs (0.87) → Neural Index (0.82) → External (0.75)\n3. Multi-hop traversal: ${hops} reasoning hops across ${hops + rand(1,3)} data nodes\n4. Cross-correlation: Checked scan results against log patterns — ${pick(['no conflicting signals', 'minor temporal discrepancy resolved', 'pattern convergence confirmed'])}\n5. Confidence: ${parseFloat(confidence) > 0.9 ? 'HIGH' : 'MODERATE'} (${confidence}) — ${pick(['sufficient data density for reliable assessment', 'strong signal-to-noise ratio', 'high source agreement across all feeds'])}\n6. Recommendation: Review top ${rand(2,3)} results for actionable intelligence`;
}
