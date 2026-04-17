/**
 * DIETER Local Simulation Layer — Enhanced Intelligence Engine
 * Provides client-side data when the Express backend is unreachable
 * (i.e., deployed static site without Docker stack running).
 * Mirrors the full enhanced routes.ts outputs: randomized scans,
 * 12+ DIETER AI chat patterns, context-specific search results.
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

// ── Randomization Helpers ──
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rttMs(): string { return (Math.random() * 2 + 0.1).toFixed(2); }

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

// ── Enhanced Scan Outputs (mirrors routes.ts) ──
function generateOutput(tool: string, target: string): string {
  const generators: Record<string, (t: string) => string> = {
    nmap: generateNmapOutput,
    nikto: generateNiktoOutput,
    golismero: generateGolismeroOutput,
    bdfproxy: generateBdfproxyOutput,
  };
  return (generators[tool] || (() => "Scan completed."))(target);
}

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
    "[DIETER-IDS] \u26A0 Port 3306/tcp filtered \u2014 possible firewall evasion. Logging event.",
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
    "+ /api/config: Configuration endpoint exposed \u2014 potential secrets leak.",
    "+ OSVDB-3092: /sitemap.xml: Sitemap found.",
    "+ /login: Default credentials may exist (admin/admin).",
    "+ /server-status: Apache server-status page found (mod_status).",
    "+ /phpinfo.php: PHP info page found \u2014 version and config exposed.",
    "+ /.env: Environment file accessible \u2014 contains database credentials.",
    "+ /api/debug: Debug endpoint returns stack traces with internal paths.",
    "+ /backup/: Backup directory found with .sql dump files.",
    "+ OSVDB-6694: /trace.axd: ASP.NET trace information leak.",
    "+ /wp-admin/: WordPress admin panel detected \u2014 check for updates.",
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

[DIETER-IDS] Severity: ${severity} \u2014 ${vulnCount} findings across ${rand(3, 8)} categories.
[DIETER-IDS] ${vulnCount > 8 ? '\u26A0 CRITICAL: Credential/config exposure detected. Immediate remediation required.' : 'Recommend reviewing flagged endpoints. No critical exposures.'}`;
}

function generateGolismeroOutput(target: string): string {
  const urlCount = rand(8, 30);
  const subdomains = rand(1, 8);
  const riskScore = (Math.random() * 4 + 4).toFixed(1);
  const vulns = [
    "[!] SQL Injection (CRITICAL) at /api/search?q= \u2014 parameterized queries not used",
    "[!] Reflected XSS (HIGH) at /comment \u2014 user input echoed without sanitization",
    "[!] Open Redirect (MEDIUM) at /redirect?url= \u2014 no whitelist validation",
    "[!] CSRF Token Missing (MEDIUM) on /api/settings \u2014 state-changing POST without token",
    "[!] Information Disclosure (LOW) at /api/debug \u2014 stack traces in 500 responses",
    "[!] Directory Traversal (HIGH) at /api/files?path= \u2014 path not sanitized",
    "[!] Insecure Deserialization (CRITICAL) at /api/import \u2014 accepts untrusted serialized data",
    "[!] Broken Authentication (HIGH) at /api/admin \u2014 no rate limiting on login",
  ];
  const selectedVulns = vulns.sort(() => Math.random() - 0.5).slice(0, rand(3, 6));
  const critCount = selectedVulns.filter(v => v.includes('CRITICAL')).length;
  const highCount = selectedVulns.filter(v => v.includes('HIGH')).length;

  return `GoLismero v2.0 \u2014 Orchestrated Security Testing
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Target: ${target}
Started: ${new Date().toISOString()}
Plugins loaded: Nmap, Nikto, SQLMap, XSSer, DNS bruteforce
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

[*] Phase 1: Reconnaissance
    [+] DNS resolution: ${target} \u2192 ${rand(10,200)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}
    [+] Found ${subdomains} subdomains: ${['api','dev','staging','admin','mail','cdn','static'].sort(() => Math.random() - 0.5).slice(0, subdomains).map(s => s + '.' + target).join(', ')}
    [+] Web spider crawled ${urlCount} URLs

[*] Phase 2: Vulnerability Assessment
${selectedVulns.join('\n')}

[*] Phase 3: Risk Assessment
    Overall Risk Score: ${riskScore} / 10 (${parseFloat(riskScore) > 7 ? 'HIGH' : parseFloat(riskScore) > 5 ? 'MEDIUM' : 'LOW'})
    Critical: ${critCount}  |  High: ${highCount}  |  Medium: ${selectedVulns.length - critCount - highCount}  |  Info: ${rand(2, 8)}

[*] Full HTML report exported to: /var/dieter/reports/golismero_${target.replace(/\./g, '_')}.html

[DIETER-IDS] Golismero audit complete. ${selectedVulns.length} findings across ${rand(3, 6)} attack vectors.
[DIETER-IDS] ${critCount > 0 ? '\u26A0 CRITICAL vulnerabilities detected. Blocking deployment recommendation issued.' : 'No critical findings. Recommend patching HIGH severity items within 48 hours.'}`;
}

function generateBdfproxyOutput(target: string): string {
  const httpReqs = rand(30, 120);
  const httpsHandshakes = rand(8, 40);
  const credEvents = rand(0, 6);
  const duration = rand(30, 180);

  return `BDFProxy v0.3.9 \u2014 Binary Defence Framework Proxy
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Target: ${target}
Interface: eth0
Gateway: ${target.includes('.') ? target.split('.').slice(0, 3).join('.') + '.1' : '192.168.1.1'}
Started: ${new Date().toISOString()}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

[*] ARP spoofing initialized \u2014 gratuitous ARP sent to gateway
[*] MITM position established. Intercepting traffic.
[+] Duration: ${duration}s active capture

\u2500\u2500 Traffic Summary \u2500\u2500
  HTTP requests captured:      ${httpReqs}
  HTTPS handshakes observed:   ${httpsHandshakes}
  DNS queries intercepted:     ${rand(50, 200)}
  Unique user agents:          ${rand(3, 12)}

\u2500\u2500 Credential Analysis \u2500\u2500
  Unencrypted auth detected:   ${credEvents}
  ${credEvents > 0 ? `  \u2192 POST /login (Basic Auth over HTTP)
  \u2192 POST /api/auth (cleartext password field)
  \u2192 Cookie: session_id transmitted without Secure flag` : '  No cleartext credentials detected in this capture window.'}

\u2500\u2500 Binary Analysis \u2500\u2500
  Executables downloaded:       ${rand(0, 4)}
  PE files detected:            ${rand(0, 2)}
  Patch module:                 STANDBY (requires explicit scope authorization)

[*] PCAP saved: /var/dieter/captures/bdfproxy_${target.replace(/\./g, '_')}_${Date.now()}.pcap
[*] Session terminated cleanly. ARP tables restored.

[DIETER-IDS] Traffic analysis complete.
[DIETER-IDS] ${credEvents > 3 ? '\u26A0 HIGH RISK: Multiple credential exposure events. Enforce HTTPS and HSTS immediately.' : credEvents > 0 ? 'Credential exposure detected. Review HTTP\u2192HTTPS migration for affected endpoints.' : '\u2713 No credential exposure. Transport security appears adequate.'}`;
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

// ── DIETER AI Brain — Enhanced Response Engine (mirrors routes.ts) ──
function generateDieterResponse(input: string): string {
  const lower = input.toLowerCase();
  const ts = new Date().toISOString().split('T')[1].split('.')[0];

  // Greetings
  if (/^(hello|hi|hey|yo|sup|what'?s? up)/i.test(lower)) {
    return `Commander Dant\u00E9. DIETER Neural Security Brain v6.1 reporting for duty.\n\n\u250C\u2500 System Status \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502 Encryption:  AES-256-GCM    \u2713 ARMED \u2502\n\u2502 Zero Trust:  Micro-seg      \u2713 ACTIVE\u2502\n\u2502 IDS:         847K sigs      \u2713 LOADED\u2502\n\u2502 LLM:         Ollama         \u2713 ONLINE\u2502\n\u2502 Vector DB:   Qdrant         \u2713 READY \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n\nAll systems operational. What's the objective?`;
  }

  // Help / capabilities
  if (lower.includes("help") || lower.includes("what can") || lower.includes("capabilities") || lower.includes("features")) {
    return `DIETER Neural Security Hub \u2014 Capability Matrix\n\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557\n\u2551  SECURITY LAYER                                  \u2551\n\u2551  \u2022 Nmap \u2014 Network discovery & port scanning      \u2551\n\u2551  \u2022 Nikto \u2014 Web server vulnerability assessment   \u2551\n\u2551  \u2022 Golismero \u2014 Orchestrated multi-tool audits     \u2551\n\u2551  \u2022 BDFProxy \u2014 Traffic interception & analysis    \u2551\n\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563\n\u2551  AI LAYER                                        \u2551\n\u2551  \u2022 Ollama \u2014 Local LLM inference (no cloud leak)  \u2551\n\u2551  \u2022 Qdrant \u2014 Vector DB for RAG document retrieval \u2551\n\u2551  \u2022 Open WebUI \u2014 Full chat interface              \u2551\n\u2551  \u2022 n8n \u2014 400+ workflow integrations               \u2551\n\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563\n\u2551  AGENT LAYER                                     \u2551\n\u2551  \u2022 OpenJarvis \u2014 Autonomous agent orchestration   \u2551\n\u2551  \u2022 OpenClaw \u2014 Plugin SDK for custom skills       \u2551\n\u2551  \u2022 Neural Search \u2014 Multi-hop reasoning engine    \u2551\n\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n\nAll data stays local. Zero cloud dependency. Your rules, Commander.`;
  }

  // Scans / nmap / nikto / golismero / bdfproxy
  if (lower.includes("scan") || lower.includes("nmap") || lower.includes("nikto") || lower.includes("golismero") || lower.includes("bdfproxy") || lower.includes("pentest") || lower.includes("penetration")) {
    return `Security Terminal standing by.\n\n\u26A0 AUTHORISED USE ONLY \u2014 Scans require explicit written scope agreements.\n\nAvailable tools:\n  1. Nmap    \u2192 Network discovery, port scan, OS fingerprinting, NSE scripts\n  2. Nikto   \u2192 Web server vulnerabilities, misconfigurations, default creds\n  3. Golismero \u2192 Orchestrated audit (chains Nmap + Nikto + SQLMap + XSSer)\n  4. BDFProxy  \u2192 MITM traffic intercept, credential capture, binary analysis\n\nNavigate to SECURITY \u2192 select tool \u2192 enter target \u2192 confirm authorization.\nAll scans are logged to DIETER-IDS with full audit trail.`;
  }

  // Status / health / systems
  if (lower.includes("status") || lower.includes("health") || lower.includes("systems") || lower.includes("services")) {
    return `System Health Report \u2014 ${ts}\n\n\u250C\u2500 Core Services \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502 Ollama       :11434   \u25CF ONLINE   LLM inference    \u2502\n\u2502 Open WebUI   :3000    \u25CF ONLINE   Chat interface   \u2502\n\u2502 n8n          :5678    \u25CF ONLINE   Workflow engine   \u2502\n\u2502 Qdrant       :6333    \u25CF ONLINE   Vector database   \u2502\n\u2502 PostgreSQL   :5432    \u25CF ONLINE   Data store        \u2502\n\u2502 OpenJarvis   :8080    \u25CF ONLINE   Agent system      \u2502\n\u2502 OpenClaw     :9090    \u25CF ONLINE   Plugin SDK        \u2502\n\u251C\u2500 Security Tools \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524\n\u2502 Nmap         CLI      \u25CF ONLINE   Port scanner      \u2502\n\u2502 Nikto        CLI      \u25CF ONLINE   Web vuln scanner  \u2502\n\u2502 Golismero    CLI      \u25C9 DEGRADED Orchestrator       \u2502\n\u2502 BDFProxy     CLI      \u25CB OFFLINE  Traffic intercept  \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n\n9/11 services operational. BDFProxy requires manual activation with scope authorization.`;
  }

  // Search queries
  if (lower.includes("search") || lower.includes("find") || lower.includes("lookup") || lower.includes("query")) {
    return `Neural Search Engine engaged.\n\nMy decision layer uses multi-hop reasoning across 4 data sources:\n  1. Scan DB     \u2014 All historical scan results (Nmap, Nikto, Golismero)\n  2. System Logs \u2014 Real-time IDS alerts, auth events, service health\n  3. Neural Index \u2014 Qdrant vector embeddings of security documents\n  4. External Intel \u2014 CVE feeds, threat indicators, OSINT\n\nI don't just retrieve \u2014 I cross-correlate patterns across sources, rank by confidence, and flag contradictions.\n\nNavigate to SEARCH or ask me directly: "search [your query]"`;
  }

  // Threat / vulnerability / CVE
  if (lower.includes("threat") || lower.includes("vuln") || lower.includes("cve") || lower.includes("exploit") || lower.includes("attack")) {
    return `Threat Intelligence Module activated.\n\nCurrent threat landscape assessment:\n  \u2022 Zero-day monitoring: Active via external intel feeds\n  \u2022 CVE correlation: Cross-referencing scan results against NVD/NIST\n  \u2022 Pattern analysis: IDS signatures updated (847,291 active)\n  \u2022 Anomaly detection: ML pipeline monitoring network baselines\n\nTo investigate a specific threat:\n  \u2192 Run a targeted scan in Security Terminal\n  \u2192 Search the Neural Index for historical patterns\n  \u2192 Ask me about a specific CVE (e.g., "CVE-2024-3094")\n\nAll intelligence is processed locally. No external data leakage.`;
  }

  // Network / infrastructure
  if (lower.includes("network") || lower.includes("infrastructure") || lower.includes("docker") || lower.includes("architecture")) {
    return `DIETER Architecture \u2014 Docker Network Topology\n\n  dieter-network (172.20.0.0/16) \u2014 Zero Trust micro-segmentation\n  \u251C\u2500\u2500 dieter-hub       :5000  \u2502 Command center + API gateway\n  \u251C\u2500\u2500 ollama           :11434 \u2502 LLM inference (GPU-accelerated)\n  \u251C\u2500\u2500 open-webui       :3000  \u2502 Chat interface \u2192 Ollama\n  \u251C\u2500\u2500 n8n              :5678  \u2502 Workflow automation (400+ integrations)\n  \u251C\u2500\u2500 qdrant           :6333  \u2502 Vector DB for semantic search\n  \u251C\u2500\u2500 postgres         :5432  \u2502 Persistent data store\n  \u251C\u2500\u2500 openjarvis       :8080  \u2502 Agent orchestration system\n  \u251C\u2500\u2500 openclaw         :9090  \u2502 Plugin SDK runtime\n  \u2514\u2500\u2500 security-tools   :---   \u2502 Nmap, Nikto, Golismero (CLI)\n\nAll inter-service communication encrypted. External access through DIETER Hub only.`;
  }

  // Ollama / AI / LLM
  if (lower.includes("ollama") || lower.includes("llm") || lower.includes("model") || lower.includes("ai") || lower.includes("intelligence")) {
    return `AI Inference Stack \u2014 Local & Private\n\n  Ollama Engine (:11434)\n  \u251C\u2500\u2500 Model management: Pull, run, and switch models on-demand\n  \u251C\u2500\u2500 GPU acceleration: NVIDIA CUDA / AMD ROCm support\n  \u251C\u2500\u2500 Context window: Up to 128K tokens (model-dependent)\n  \u2514\u2500\u2500 API: OpenAI-compatible \u2014 any tool can connect\n\n  Qdrant Vector DB (:6333)\n  \u251C\u2500\u2500 RAG pipeline: Document embeddings for knowledge retrieval\n  \u251C\u2500\u2500 Semantic search: Cosine similarity across security docs\n  \u2514\u2500\u2500 Collections: scan_reports, threat_intel, network_topology\n\n  Open WebUI (:3000)\n  \u2514\u2500\u2500 Full chat interface with document upload, web search, and tool calling\n\nAll inference runs locally. Zero data leaves the network.`;
  }

  // n8n / workflow / automation
  if (lower.includes("n8n") || lower.includes("workflow") || lower.includes("automat")) {
    return `n8n Workflow Engine (:5678) \u2014 400+ Integrations\n\nActive automation capabilities:\n  \u2022 Scan scheduling: Cron-triggered Nmap sweeps on defined subnets\n  \u2022 Alert pipeline: Severity-based routing \u2192 Slack/email/webhook\n  \u2022 Report generation: Auto-compile findings into PDF after scan chains\n  \u2022 Threat correlation: Cross-reference new CVEs against scan history\n  \u2022 Log aggregation: Centralized logging from all DIETER services\n\nAuth: dieter / [protected]\nTimezone: Africa/Johannesburg\n\nWorkflows are version-controlled and exportable.`;
  }

  // Who are you / about DIETER
  if (lower.includes("who are you") || lower.includes("about") || lower.includes("dieter") || lower.includes("what is this")) {
    return `I am DIETER \u2014 Neural Security Hub v6.1.\n\nBuilt by Transparent Programs & Design for Commander Dant\u00E9.\n\nI am a self-hosted, air-gapped security intelligence platform that combines:\n  \u2022 Penetration testing tools (Nmap, Nikto, Golismero, BDFProxy)\n  \u2022 Local AI inference (Ollama + Qdrant RAG pipeline)\n  \u2022 Autonomous agents (OpenJarvis + OpenClaw SDK)\n  \u2022 Workflow automation (n8n \u2014 400+ integrations)\n  \u2022 Neural search with multi-hop reasoning\n\nEvery byte stays on your infrastructure. No cloud. No telemetry. No compromise.\n\nAuthorised use only. All operations logged.`;
  }

  // Fallback — intelligent contextual response
  return `Processing through neural decision layer...\n\nQuery: "${input}"\nTimestamp: ${ts}\nConfidence: Analyzing...\n\nI've parsed your input against my knowledge domains:\n  1. Security operations \u2192 ${lower.includes("port") || lower.includes("ip") || lower.includes("host") ? 'HIGH relevance' : 'No direct match'}\n  2. System administration \u2192 ${lower.includes("config") || lower.includes("log") || lower.includes("service") ? 'HIGH relevance' : 'No direct match'}\n  3. Threat intelligence \u2192 ${lower.includes("risk") || lower.includes("alert") || lower.includes("breach") ? 'HIGH relevance' : 'No direct match'}\n\nFor the most actionable response, try:\n  \u2022 A targeted scan: Navigate to Security Terminal\n  \u2022 Intelligence search: Navigate to Neural Search\n  \u2022 System check: Ask me "status" or "health"\n\nAll operations logged. Your move, Commander.`;
}

// ── Neural Search — Enhanced (mirrors routes.ts) ──
export function neuralSearch(query: string) {
  const lower = query.toLowerCase();
  const baseResults = [
    { title: `Scan Intelligence: ${query}`, source: "DIETER Scan DB", relevance: 0.94, summary: `Correlated findings from recent security scans matching "${query}". Cross-referenced with NIST vulnerability database. ${rand(2,8)} direct matches found across ${rand(1,5)} scan sessions.` },
    { title: `System Log Analysis: ${query}`, source: "DIETER Logs", relevance: 0.87, summary: `${rand(12, 89)} log entries matched. Pattern analysis suggests ${pick(['recurring activity windows', 'anomalous access patterns', 'periodic reconnaissance attempts', 'automated scanning behavior'])}. Time-series clustering applied.` },
    { title: `Network Intelligence: ${query}`, source: "Neural Index", relevance: 0.82, summary: `Multi-hop reasoning across network topology data. ${rand(2,6)} potential correlation paths identified. Qdrant vector similarity: ${(Math.random() * 0.15 + 0.80).toFixed(3)}.` },
    { title: `Threat Feed: ${query}`, source: "External Intel", relevance: 0.75, summary: `Matched against ${rand(3,12)} known threat indicators. ${pick(['No active CVEs detected for current configuration.', 'CVE correlation found \u2014 review recommended.', 'Pattern matches MITRE ATT&CK technique T' + rand(1000,1999) + '.', 'OSINT sources indicate similar activity in APT campaigns.'])}` },
  ];

  // Add context-specific results
  if (lower.includes('ssh') || lower.includes('brute')) {
    baseResults.push({ title: `SSH Hardening Report`, source: "DIETER Knowledge Base", relevance: 0.71, summary: `Recommended: Disable password auth, enforce key-based only. Set MaxAuthTries=3. Enable fail2ban with 15-min ban window. Review /etc/ssh/sshd_config.` });
  }
  if (lower.includes('sql') || lower.includes('injection')) {
    baseResults.push({ title: `SQL Injection Prevention Matrix`, source: "DIETER Knowledge Base", relevance: 0.69, summary: `Parameterized queries required on all endpoints. ORM usage detected on ${rand(60,95)}% of routes. Manual review flagged ${rand(1,4)} raw query constructions.` });
  }

  const confidence = (Math.random() * 0.15 + 0.82).toFixed(2);
  const hops = rand(3, 6);

  return {
    query,
    results: baseResults,
    reasoning: `Neural Decision Layer \u2014 Multi-hop Reasoning Chain:\n1. Query decomposition: "${query}" \u2192 [primary intent: ${pick(['reconnaissance', 'vulnerability assessment', 'threat hunting', 'compliance check', 'incident response'])}] + [context signals: ${pick(['network scope', 'temporal range', 'severity filter', 'asset classification'])}]\n2. Source ranking: Scan DB (0.94) \u2192 Logs (0.87) \u2192 Neural Index (0.82) \u2192 External (0.75)\n3. Multi-hop traversal: ${hops} reasoning hops across ${hops + rand(1,3)} data nodes\n4. Cross-correlation: Checked scan results against log patterns \u2014 ${pick(['no conflicting signals', 'minor temporal discrepancy resolved', 'pattern convergence confirmed'])}\n5. Confidence: ${parseFloat(confidence) > 0.9 ? 'HIGH' : 'MODERATE'} (${confidence}) \u2014 ${pick(['sufficient data density for reliable assessment', 'strong signal-to-noise ratio', 'high source agreement across all feeds'])}\n6. Recommendation: Review top ${rand(2,3)} results for actionable intelligence`,
  };
}

// ── System Logs ──
export function getSystemLogs() {
  return [] as { id: number; level: string; source: string; message: string; createdAt: string }[];
}
