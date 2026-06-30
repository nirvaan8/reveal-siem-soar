// simulator.js
// Attack Simulation Engine - automatically pushes mock Wazuh alerts to the backend
// to make the platform interactive and fully visual out-of-the-box.

const riskEngine = require('./riskEngine');
const playbookManager = require('./playbookManager');
const aiAnalyst = require('./aiAnalyst');

class AttackSimulator {
  constructor() {
    this.intervalId = null;
    this.wsBroadcast = () => {};
    this.alertsHistory = [];
    this.isRunning = false;
  }

  setBroadcastCallback(callback) {
    this.wsBroadcast = callback;
  }

  start(intervalMs = 30000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Simulator] Threat generation active. Launching simulated attack logs every ${intervalMs / 1000}s.`);
    
    // Fire an initial alert instantly so user doesn't wait
    setTimeout(() => this.triggerRandomAttack(), 2000);
    
    this.intervalId = setInterval(() => {
      this.triggerRandomAttack();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[Simulator] Threat generation paused.');
  }

  getAlertsHistory() {
    return this.alertsHistory;
  }

  // Handle incoming alerts (both simulated and real forwarded ones from Kali VM)
  async handleIncomingAlert(alert) {
    // Generate unique ID if missing
    if (!alert.id) alert.id = `alert-${Math.floor(Math.random() * 90000000 + 10000000)}`;
    if (!alert.timestamp) alert.timestamp = new Date().toISOString();

    // 1. Process Alert in Risk Engine (UEBA)
    const riskResult = riskEngine.processAlert(alert);
    
    // 2. Save alert in local cache
    this.alertsHistory.unshift(alert);
    if (this.alertsHistory.length > 100) this.alertsHistory.pop();

    // 3. Generate AI Analyst insight in background
    let aiInsight = "Analyzing telemetry...";
    
    // We update alert object with pending status
    alert.aiAnalysis = { status: 'analyzing', text: '' };
    
    // Broadcast initial alert to dashboard
    this.broadcastAlert(alert);

    // 4. Trigger SOAR Playbook if alert is severe enough
    let playbookRunId = null;
    const ruleDesc = alert.rule?.description || '';
    const level = alert.rule?.level || 0;

    if (level >= 8) {
      let playbookId = 'block-ip'; // Default playbook
      if (ruleDesc.toLowerCase().includes('process') || ruleDesc.toLowerCase().includes('kill') || alert.data?.pid) {
        playbookId = 'kill-process';
      } else if (ruleDesc.toLowerCase().includes('integrity') || ruleDesc.toLowerCase().includes('ransomware') || alert.syscheck) {
        playbookId = 'quarantine-file';
      }
      
      // Trigger playbook (defaulting autoRemediate to false to show "Awaiting Approval" dashboard button)
      playbookRunId = await playbookManager.triggerPlaybook(playbookId, alert, false);
      alert.playbookRunId = playbookRunId;
    }

    // Now call AI analyst
    aiAnalyst.analyzeAlert(alert).then(result => {
      alert.aiAnalysis = { status: 'completed', text: result };
      this.broadcastAlert(alert);
    });

    // Also broadcast updated risk engine summary
    this.wsBroadcast({
      type: 'RISK_UPDATE',
      data: riskEngine.getRiskSummary()
    });
  }

  broadcastAlert(alert) {
    this.wsBroadcast({
      type: 'NEW_ALERT',
      data: alert
    });
  }

  triggerRandomAttack() {
    const attacks = [
      // 1. SSH Brute Force
      () => {
        const attackerIP = `185.220.101.${Math.floor(Math.random() * 250 + 2)}`;
        const targetUser = ['root', 'admin', 'kali', 'ftpuser', 'ubuntu'][Math.floor(Math.random() * 5)];
        return {
          id: `sim-${Date.now()}`,
          timestamp: new Date().toISOString(),
          agent: { id: '001', name: 'Kali-VM', ip: '192.168.121.20' },
          manager: { name: 'SIEM-HQ' },
          rule: {
            id: '5712',
            level: 10,
            description: 'sshd: brute force attack - multiple failed authentication attempts detected',
            groups: ['syslog', 'sshd', 'invalid_login', 'authentication_failed']
          },
          data: {
            srcip: attackerIP,
            srcport: `${Math.floor(Math.random() * 60000 + 1024)}`,
            dstuser: targetUser,
            app: 'sshd'
          }
        };
      },
      // 2. SQL Injection
      () => {
        const attackerIP = `91.240.118.${Math.floor(Math.random() * 250 + 2)}`;
        const vulnParams = ['id=1%20OR%201=1', 'user=admin%27%20--%20', 'search=%25%27%20UNION%20SELECT%20username,password%20FROM%20users%20--'];
        return {
          id: `sim-${Date.now()}`,
          timestamp: new Date().toISOString(),
          agent: { id: '001', name: 'Kali-VM', ip: '192.168.121.20' },
          manager: { name: 'SIEM-HQ' },
          rule: {
            id: '31103',
            level: 8,
            description: 'Web application: SQL injection attack attempt detected in URI parameter',
            groups: ['web', 'accesslog', 'sql_injection', 'attack']
          },
          data: {
            srcip: attackerIP,
            request: `/portal/login.php?${vulnParams[Math.floor(Math.random() * vulnParams.length)]}`,
            status: '200',
            app: 'apache2'
          }
        };
      },
      // 3. Ransomware/Suspicious File Write
      () => {
        const fileNames = [
          '/home/kali/documents/financial_report.docx.crypt',
          '/var/www/html/assets/webshell.php',
          '/etc/cron.d/backdoor_cron',
          '/home/kali/Downloads/update_patch.elf'
        ];
        const targetPath = fileNames[Math.floor(Math.random() * fileNames.length)];
        const isRansom = targetPath.endsWith('.crypt');
        
        return {
          id: `sim-${Date.now()}`,
          timestamp: new Date().toISOString(),
          agent: { id: '001', name: 'Kali-VM', ip: '192.168.121.20' },
          manager: { name: 'SIEM-HQ' },
          rule: {
            id: isRansom ? '100201' : '100202',
            level: 12,
            description: isRansom 
              ? 'FIM: Suspicious mass file modification with high-entropy (Ransomware signature)'
              : 'FIM: Write operation detected in root sensitive folder (Potential malware drop)',
            groups: ['syscheck', 'fim', 'file_modified']
          },
          syscheck: {
            path: targetPath,
            event: 'added',
            size_after: '24982',
            audit: {
              user: 'kali',
              process: {
                name: isRansom ? 'cryptor.bin' : 'wget',
                id: `${Math.floor(Math.random() * 8000 + 2000)}`
              }
            }
          },
          data: {
            pid: `${Math.floor(Math.random() * 8000 + 2000)}`,
            filename: targetPath
          }
        };
      }
    ];

    const chosenAttack = attacks[Math.floor(Math.random() * attacks.length)]();
    this.handleIncomingAlert(chosenAttack);
  }
}

module.exports = new AttackSimulator();
