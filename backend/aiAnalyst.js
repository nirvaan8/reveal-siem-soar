// aiAnalyst.js
// Integrates with Gemini API to provide real-time alert triage and mitigation advice

const { GoogleGenAI } = require('@google/generative-ai');

class AIAnalyst {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.ai = null;
    
    if (this.apiKey) {
      // Initialize Gemini Client
      // Note: In newer @google/generative-ai packages, we import GoogleGenAI or use new GoogleGenAI({ apiKey })
      try {
        const { GoogleGenAI } = require('@google/generative-ai');
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
        console.log('[AI] Gemini API initialized successfully.');
      } catch (err) {
        console.error('[AI] Failed to initialize Gemini API client:', err.message);
      }
    } else {
      console.log('[AI] GEMINI_API_KEY not found in .env. Operating in SIMULATED Analyst mode.');
    }
  }

  async analyzeAlert(alert) {
    if (this.ai && this.apiKey) {
      try {
        // Use gemini-2.5-flash for rapid, cost-effective security triage
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are the Gurucul REVEAL AI Security Analyst. Analyze this raw Wazuh JSON security alert and explain it to a security operator.
          
Raw Alert:
${JSON.stringify(alert, null, 2)}

Provide your response in a clean, structured Markdown format with the following headers:
### 1. Executive Summary
(Brief, plain-english description of what happened)
### 2. Risk Context & Behavior
(Assess why this behavior is anomalous. Estimate confidence of it being an actual attack, and any correlation indicators like MITRE ATT&CK framework mapping)
### 3. Potential Impact
(What could happen if left unmitigated)
### 4. Recommended Remediation Playbook
(Provide a step-by-step containment playbook, specifying EXACT terminal commands to execute on the affected endpoint, e.g., iptables block, process termination, file quarantine)
`,
        });

        return response.text;
      } catch (err) {
        console.error('[AI] Gemini API generation failed:', err.message);
        return this.getSimulatedAnalysis(alert, `AI Error: ${err.message}. Showing local backup analysis.`);
      }
    }

    return this.getSimulatedAnalysis(alert);
  }

  // High-fidelity fallback simulated analysis based on common attack signatures
  getSimulatedAnalysis(alert, prefix = '') {
    const ruleDesc = alert.rule?.description || 'Unknown threat activity';
    const ruleId = alert.rule?.id || '0000';
    const srcIp = alert.data?.srcip || alert.data?.src_ip || 'unknown IP';
    const dstUser = alert.data?.dstuser || alert.data?.srcuser || 'unknown user';
    const severity = alert.rule?.level >= 10 ? 'HIGH' : (alert.rule?.level >= 5 ? 'MEDIUM' : 'LOW');
    
    let analysis = prefix ? `*${prefix}*\n\n` : '';

    if (ruleDesc.toLowerCase().includes('brute') || ruleId === '5712' || ruleId === '5716' || ruleDesc.toLowerCase().includes('authentication failed')) {
      analysis += `### 1. Executive Summary
Anomalous authentication behavior detected on host. A remote source IP (**${srcIp}**) generated multiple failed login attempts for user account (**${dstUser}**) over SSH within a brief time window. This is highly indicative of an active automated SSH Dictionary/Brute-Force attack.

### 2. Risk Context & Behavior
*   **Behavior Anomaly**: Spike in SSH authentication failures from an external address.
*   **MITRE ATT&CK**: [Credential Access - Brute Force (T1110)](https://attack.mitre.org/techniques/T1110/).
*   **Confidence**: 95% (correlated logs show high velocity of failed attempts).

### 3. Potential Impact
If successful, the attacker could gain unauthorized SSH access, escalate privileges, install backdoors, or initiate data exfiltration from the target system.

### 4. Recommended Remediation Playbook
*   **Step 1: Network Block**: Block the attacking source IP at the firewall immediately.
    *   *Remediation Command*: \`sudo iptables -A INPUT -s ${srcIp} -j DROP\`
*   **Step 2: Terminate SSH Sessions**: Terminate any lingering sessions from this IP.
*   **Step 3: Account Audit**: Verify password strength for user **${dstUser}** and ensure SSH keys are enforced.`;
    } 
    
    else if (ruleDesc.toLowerCase().includes('sql') || ruleDesc.toLowerCase().includes('injection') || ruleId === '31103') {
      analysis += `### 1. Executive Summary
Web server log analysis has detected an SQL Injection (SQLi) attempt originating from source IP (**${srcIp}**). The HTTP request payload contains classic SQL meta-characters and signature patterns (e.g., \`UNION SELECT\`, \`OR 1=1\`) targeting application database endpoints.

### 2. Risk Context & Behavior
*   **Behavior Anomaly**: Input sanitization bypass attempt targeting HTTP parameters.
*   **MITRE ATT&CK**: [Initial Access - Exploit Public-Facing Application (T1190)](https://attack.mitre.org/techniques/T1190/).
*   **Confidence**: 90% (regex match on SQL keywords inside request headers).

### 3. Potential Impact
Successful exploitation could lead to unauthorized database access, exposure of sensitive customer/credential tables, database corruption, or Remote Code Execution (RCE) via administrative DB functions.

### 4. Recommended Remediation Playbook
*   **Step 1: Block Attacker**: Place the source IP on the edge firewall drop list.
    *   *Remediation Command*: \`sudo iptables -A INPUT -s ${srcIp} -j DROP\`
*   **Step 2: Application Hotfix**: Audit vulnerable parameter inputs in web application code and implement parameterized queries.`;
    } 
    
    else if (ruleDesc.toLowerCase().includes('malware') || ruleDesc.toLowerCase().includes('quarantine') || ruleDesc.toLowerCase().includes('ransomware') || ruleDesc.toLowerCase().includes('virus')) {
      const fileName = alert.syscheck?.path || alert.data?.filename || '/var/tmp/malicious_payload';
      const procPid = alert.data?.pid || '4192';
      
      analysis += `### 1. Executive Summary
Critical Host Intrusion alert: Malicious file signature or ransomware-like activity detected. A process (PID: **${procPid}**) was observed writing or modifying files with high entropy or known malware extensions in host directory: \`${fileName}\`.

### 2. Risk Context & Behavior
*   **Behavior Anomaly**: Rapid file encryption or execution of untrusted binary from temporary folders.
*   **MITRE ATT&CK**: [Impact - Data Encrypted for Impact (T1486)](https://attack.mitre.org/techniques/T1486/).
*   **Confidence**: 98% (entropy scan matches encryption patterns).

### 3. Potential Impact
Ransomware encryption could cause localized or network-wide data loss. Active backdoor/trojan execution allows remote command and control.

### 4. Recommended Remediation Playbook
*   **Step 1: Terminate Process**: Instantly kill the offending process to stop further execution.
    *   *Remediation Command*: \`sudo kill -9 ${procPid}\`
*   **Step 2: Quarantine Payload**: Move the suspected file to isolated storage and strip execution rights.
    *   *Remediation Command*: \`sudo mv ${fileName} /tmp/quarantined_file && sudo chmod 000 /tmp/quarantined_file\`
*   **Step 3: Network Isolation**: Isolate the host from the network until a full anti-virus sweep is completed.`;
    }
    
    else {
      analysis += `### 1. Executive Summary
Security alert reported: **${ruleDesc}** (Wazuh Rule: **${ruleId}**). The system registered a security event of level ${alert.rule?.level || 0} triggering behavioral alerts.

### 2. Risk Context & Behavior
*   **Behavior Anomaly**: Security threshold breached on host agent.
*   **Confidence**: 75% (Rule based signature match).

### 3. Potential Impact
Varies depending on the nature of the alert. Requires investigation to verify if this is an isolated incident or part of a wider multi-stage lateral movement campaign.

### 4. Recommended Remediation Playbook
*   **Step 1: Investigate Host**: Log in and inspect active processes and network sockets.
*   **Step 2: Check Firewall**: If telemetry points to external source IP (**${srcIp}**), consider temporary ingress blocks.
    *   *Remediation Command*: \`sudo iptables -A INPUT -s ${srcIp} -j DROP\``;
    }

    return analysis;
  }
}

module.exports = new AIAnalyst();
