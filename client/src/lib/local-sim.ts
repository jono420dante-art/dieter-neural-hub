/**
 * DIETER Local Simulation Layer
 * Provides client-side data when the Express backend is unreachable
 * (i.e., deployed static site without Docker stack running).
 */

// ── State ──
let scanJobs: ScanJob[] = [];
let chatMessages: ChatMsg[] = [];
let scanIdCounter = 1;
let chatIdCounter = 1;

interface ScanJob {
  id: number;
  tool: string;
  target: string;
  status: string;
  output: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface ChatMsg {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

interface Service {
  id: number;
  name: string;
  status: string;
  port: number | null;
  lastChecked: string;
}

// ── Detect if backend is available ──
let backendAvailable: boolean | null = null;

export async function isBackendAvailable(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch("/api/services", { signal: AbortSignal.timeout(2000) });
    backendAvailable = res.ok;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

// ── Services ──
export function getServices(): Service[] {
  return [
    { id: 1, name: "Ollama", status: "online", port: 11434, lastChecked: new Date().toISOString() },
    { id: 2, name: "Open WebUI", status: "online", port: 3000, lastChecked: new Date().toISOString() },
    { id: 3, name: "n8n", status: "online", port: 5678, lastChecked: new Date().toISOString() },
    { id: 4, name: "Qdrant", status: "online", port: 6333, lastChecked: new Date().toISOString() },
    { id: 5, name: "PostgreSQL", status: "online", port: 5432, lastChecked: new Date().toISOString() },
    { id: 6, name: "Nmap", status: "online", port: null, lastChecked: new Date().toISOString() },
    { id: 7, name: "Nikto", status: "online", port: null, lastChecked: new Date().toISOString() },
    { id: 8, name: "Golismero", status: "degraded", port: null, lastChecked: new Date().toISOString() },
    { id: 9, name: "BDFProxy", status: "offline", port: null, lastChecked: new Date().toISOString() },
    { id: 10, name: "OpenJarvis", status: "online", port: 8080, lastChecked: new Date().toISOString() },
    { id: 11, name: "OpenClaw", status: "online", port: 9090, lastChecked: new Date().toISOString() },
  ];
}

// ── Dashboard Stats ──
export function getDashboardStats() {
  const svcs = getServices();
  return {
    totalScans: scanJobs.length,
    activeScans: scanJobs.filter(s => s.status === "running").length,
    completedScans: scanJobs.filter(s => s.status === "completed").length,
    failedScans: scanJobs.filter(s => s.status === "failed").length,
    servicesOnline: svcs.filter(s => s.status === "online").length,
    servicesTotal: svcs.length,
    criticalAlerts: 0,
    recentLogs: [] as { level: string; source: string; message: string; createdAt: string }[],
  };
}

// ── Scans ──
export function getScans(): ScanJob[] {
  return [...scanJobs].reverse();
}

export function getScan(id: number): ScanJob | undefined {
  return scanJobs.find(s => s.id === id);
}

export function createScan(tool: string, target: string): ScanJob {
  const job: ScanJob = {
    id: scanIdCounter++,
    tool,
    target,
    status: "running",
    output: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  scanJobs.push(job);

  // Simulate completion after 3-7 seconds
  setTimeout(() => {
    job.status = "completed";
    job.output = generateOutput(tool, target);
    job.completedAt = new Date().toISOString();
  }, 3000 + Math.random() * 4000);

  return job;
}

function generateOutput(tool: string, target: string): string {
  const outputs: Record<string, string> = {
    nmap: `Starting Nmap 7.94SVN ( https://nmap.org )
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

[DIETER-IDS] Scan fingerprint stored. No anomalies detected.`,
    nikto: `- Nikto v2.5.0
---------------------------------------------------------------------------
+ Target IP:          ${target}
+ Target Hostname:    ${target}
+ Target Port:        80
+ Start Time:         ${new Date().toISOString()}
---------------------------------------------------------------------------
+ Server: nginx/1.24.0
+ /: The anti-clickjacking X-Frame-Options header is not present.
+ /: The X-Content-Type-Options header is not set.
+ /: Cookie session created without the httponly flag.
+ /robots.txt: contains 3 entries which should be manually viewed.
+ /admin/: Directory indexing found.
+ /api/config: Configuration endpoint exposed.
+ OSVDB-3092: /sitemap.xml: Sitemap found.
+ /login: Default credentials may exist (admin/admin).
+ 8 host(s) tested

[DIETER-IDS] 3 medium vulnerabilities flagged. Review recommended.`,
    golismero: `GoLismero Report — ${target}
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

[DIETER-IDS] Golismero audit complete. 3 high-priority findings.`,
    bdfproxy: `BDFProxy Traffic Intercept — ${target}
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

[DIETER-IDS] Traffic analysis complete. 3 credential exposure events.`,
  };
  return outputs[tool] || "Scan completed.";
}

// ── Chat ──
export function getChatMessages(): ChatMsg[] {
  return chatMessages;
}

export function sendChatMessage(content: string): ChatMsg[] {
  const userMsg: ChatMsg = {
    id: chatIdCounter++,
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };
  chatMessages.push(userMsg);

  const response = generateDieterResponse(content);
  const aiMsg: ChatMsg = {
    id: chatIdCounter++,
    role: "assistant",
    content: response,
    createdAt: new Date().toISOString(),
  };
  chatMessages.push(aiMsg);

  return [userMsg, aiMsg];
}

export function clearChat() {
  chatMessages = [];
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

// ── Neural Search ──
export function neuralSearch(query: string) {
  return {
    query,
    results: [
      { title: `Scan Intelligence: ${query}`, source: "DIETER Scan DB", relevance: 0.94, summary: `Correlated findings from recent security scans matching "${query}". Cross-referenced with NIST vulnerability database.` },
      { title: `System Log Analysis: ${query}`, source: "DIETER Logs", relevance: 0.87, summary: `${Math.floor(Math.random() * 50 + 10)} log entries matched. Pattern analysis suggests recurring activity windows.` },
      { title: `Network Intelligence: ${query}`, source: "Neural Index", relevance: 0.82, summary: `Multi-hop reasoning across network topology data. 3 potential correlation paths identified.` },
      { title: `Threat Feed: ${query}`, source: "External Intel", relevance: 0.75, summary: `Matched against known threat indicators. No active CVEs detected for current configuration.` },
    ],
    reasoning: `Neural Decision Layer — Multi-hop Reasoning Chain:
1. Query decomposition: "${query}" → [primary intent] + [context signals]
2. Source ranking: Scan DB (0.94) → Logs (0.87) → Neural Index (0.82) → External (0.75)
3. Cross-correlation: Checked scan results against log patterns — no conflicting signals
4. Confidence: HIGH (0.91) — sufficient data density for reliable assessment
5. Recommendation: Review top 2 results for actionable intelligence`,
  };
}

// ── System Logs ──
export function getSystemLogs() {
  return [] as { id: number; level: string; source: string; message: string; createdAt: string }[];
}
