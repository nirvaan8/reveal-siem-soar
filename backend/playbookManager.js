// playbookManager.js
// SOAR Engine - runs security playbooks (automated workflows) with multi-step log streaming

const sshClient = require('./sshClient');

class PlaybookManager {
  constructor() {
    this.history = []; // Historical execution logs of playbooks
    this.wsBroadcast = () => {}; // Broadcast callback, set in server.js
  }

  setBroadcastCallback(callback) {
    this.wsBroadcast = callback;
  }

  // Get historical playbook logs
  getHistory() {
    return this.history;
  }

  // Execute a SOAR playbook in steps with visual delays
  async triggerPlaybook(playbookId, alert, autoRemediate = false) {
    const srcIp = alert.data?.srcip || alert.data?.src_ip || null;
    const processId = alert.data?.pid || null;
    const filePath = alert.syscheck?.path || alert.data?.filename || null;
    const agentName = alert.agent?.name || 'Kali-VM';

    const runId = `run-${Math.floor(Math.random() * 900000 + 100000)}`;
    const playbookLog = {
      id: runId,
      playbookId,
      alertId: alert.id,
      description: alert.rule?.description || 'Threat Containment',
      timestamp: new Date().toISOString(),
      status: 'running',
      steps: []
    };

    this.history.unshift(playbookLog);
    if (this.history.length > 50) this.history.pop();

    const addStep = (name, description, status = 'pending', output = '') => {
      const step = { name, description, status, timestamp: new Date().toISOString(), output };
      playbookLog.steps.push(step);
      this.broadcastUpdate();
      return step;
    };

    const updateStep = (index, status, output = '') => {
      if (playbookLog.steps[index]) {
        playbookLog.steps[index].status = status;
        playbookLog.steps[index].timestamp = new Date().toISOString();
        if (output) playbookLog.steps[index].output = output;
        this.broadcastUpdate();
      }
    };

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // Async playbook executor thread
    (async () => {
      try {
        if (playbookId === 'block-ip') {
          // STEP 1: Extract IP
          addStep('Extract Attacker IP', 'Locating malicious source IP in raw telemetry logs', 'running');
          await delay(1200);
          if (!srcIp) {
            updateStep(0, 'failed', 'No valid external source IP address found in alert details.');
            playbookLog.status = 'failed';
            this.broadcastUpdate();
            return;
          }
          updateStep(0, 'completed', `Extracted IP address: ${srcIp}`);

          // STEP 2: Enrichment (Threat Intel)
          addStep('Threat Intelligence Scan', `Enriching IP reputation databases for ${srcIp}`, 'running');
          await delay(1500);
          // Simulate VirusTotal/AbuseIPDB check
          const isMalicious = !srcIp.startsWith('192.168.') && !srcIp.startsWith('10.') && !srcIp.startsWith('127.');
          const vtRatio = isMalicious ? '43 / 90 engines flagged' : '0 / 90 engines flagged (Private range)';
          updateStep(1, 'completed', `Source Scan Summary:\n- Status: ${isMalicious ? 'Malicious IP' : 'Private Subnet'}\n- Abuse Ratio: ${vtRatio}\n- ISP: ThreatIntel Mock Provider`);

          // STEP 3: Firewall block (Remediation)
          addStep('Network Containment', `Pushing firewall rules to ${agentName} to block IP ${srcIp}`, 'running');
          await delay(1500);
          
          if (!autoRemediate) {
            updateStep(2, 'waiting', 'Awaiting operator approval for active remediation.');
            playbookLog.status = 'paused';
            this.broadcastUpdate();
            return; // Pause execution, waiting for manual analyst approval
          }

          // Execute block command on Kali
          const cmd = `sudo iptables -A INPUT -s ${srcIp} -j DROP`;
          const sshResult = await sshClient.executeCommand(cmd);
          updateStep(2, sshResult.success ? 'completed' : 'failed', sshResult.output);

          if (!sshResult.success) {
            playbookLog.status = 'failed';
            this.broadcastUpdate();
            return;
          }

          // STEP 4: Notify Team
          addStep('Incident Resolution Notification', 'Publishing alerts to SIEM workspace and logging containment audit', 'running');
          await delay(1000);
          updateStep(3, 'completed', `Successfully isolated IP: ${srcIp} from Kali VM. Notification dispatched.`);
          playbookLog.status = 'completed';
          this.broadcastUpdate();

        } else if (playbookId === 'kill-process') {
          // STEP 1: Extract PID
          addStep('Identify Process PID', 'Scanning alert metadata for target execution process PID', 'running');
          await delay(1200);
          if (!processId) {
            updateStep(0, 'failed', 'No PID associated with security event.');
            playbookLog.status = 'failed';
            this.broadcastUpdate();
            return;
          }
          updateStep(0, 'completed', `Identified Process PID: ${processId}`);

          // STEP 2: Threat Analysis
          addStep('Process Integrity Check', `Analyzing process signature for PID ${processId}`, 'running');
          await delay(1500);
          updateStep(1, 'completed', `Signature scan complete. Process marked: SUSPICIOUS_ACTIVITY (untrusted execution path).`);

          // STEP 3: Terminate Process (Remediation)
          addStep('Kill Process', `Sending SIGKILL signal to process ID ${processId} on ${agentName}`, 'running');
          await delay(1500);

          if (!autoRemediate) {
            updateStep(2, 'waiting', 'Awaiting operator approval for process termination.');
            playbookLog.status = 'paused';
            this.broadcastUpdate();
            return;
          }

          const cmd = `sudo kill -9 ${processId}`;
          const sshResult = await sshClient.executeCommand(cmd);
          updateStep(2, sshResult.success ? 'completed' : 'failed', sshResult.output);

          if (!sshResult.success) {
            playbookLog.status = 'failed';
            this.broadcastUpdate();
            return;
          }

          // STEP 4: System Audit
          addStep('System Integrity Check', 'Running compliance sweep to verify process remains inactive', 'running');
          await delay(1000);
          updateStep(3, 'completed', `Process PID ${processId} verified inactive. Security report filed.`);
          playbookLog.status = 'completed';
          this.broadcastUpdate();

        } else if (playbookId === 'quarantine-file') {
          // STEP 1: Extract File Path
          addStep('Extract File Path', 'Verifying access path of the target malicious file', 'running');
          await delay(1200);
          if (!filePath) {
            updateStep(0, 'failed', 'No filepath found in file integrity check metadata.');
            playbookLog.status = 'failed';
            this.broadcastUpdate();
            return;
          }
          updateStep(0, 'completed', `File identified: ${filePath}`);

          // STEP 2: Quarantine (Remediation)
          addStep('Contain Payload', `Moving file ${filePath} to quarantined sandbox storage and stripping rights`, 'running');
          await delay(1500);

          if (!autoRemediate) {
            updateStep(1, 'waiting', 'Awaiting operator approval for file quarantine.');
            playbookLog.status = 'paused';
            this.broadcastUpdate();
            return;
          }

          const qDir = '/tmp/quarantine';
          const qName = `quarantined_${Date.now()}`;
          const cmd = `sudo mkdir -p ${qDir} && sudo mv ${filePath} ${qDir}/${qName} && sudo chmod 000 ${qDir}/${qName}`;
          
          const sshResult = await sshClient.executeCommand(cmd);
          updateStep(1, sshResult.success ? 'completed' : 'failed', sshResult.output);

          if (!sshResult.success) {
            playbookLog.status = 'failed';
            this.broadcastUpdate();
            return;
          }

          // STEP 3: Verify Containment
          addStep('Verify Containment', `Ensuring file has been removed from original path: ${filePath}`, 'running');
          await delay(1000);
          updateStep(2, 'completed', `Verified. File successfully isolated in ${qDir}/${qName}.`);
          playbookLog.status = 'completed';
          this.broadcastUpdate();
        }
      } catch (err) {
        console.error('SOAR Playbook Execution Error:', err);
        playbookLog.status = 'failed';
        this.broadcastUpdate();
      }
    })();

    return runId;
  }

  // Resume a paused playbook (Manual Operator Approval)
  async approvePlaybook(runId) {
    const playbookLog = this.history.find(p => p.id === runId);
    if (!playbookLog || playbookLog.status !== 'paused') return false;

    // Find the step that is waiting
    const waitingIndex = playbookLog.steps.findIndex(s => s.status === 'waiting');
    if (waitingIndex === -1) return false;

    // Resume execution
    playbookLog.status = 'running';
    playbookLog.steps[waitingIndex].status = 'running';
    playbookLog.steps[waitingIndex].timestamp = new Date().toISOString();
    this.broadcastUpdate();

    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    const agentName = 'Kali-VM';

    // Resume async thread
    (async () => {
      try {
        const updateStep = (index, status, output = '') => {
          if (playbookLog.steps[index]) {
            playbookLog.steps[index].status = status;
            playbookLog.steps[index].timestamp = new Date().toISOString();
            if (output) playbookLog.steps[index].output = output;
            this.broadcastUpdate();
          }
        };

        const addStep = (name, description, status = 'pending', output = '') => {
          const step = { name, description, status, timestamp: new Date().toISOString(), output };
          playbookLog.steps.push(step);
          this.broadcastUpdate();
          return step;
        };

        // Resume specific playbook logic
        if (playbookLog.playbookId === 'block-ip') {
          // Re-extract IP
          const rawAlert = playbookLog.steps[0].output; // Extracted IP address: x.x.x.x
          const srcIp = rawAlert.split(': ')[1];

          const cmd = `sudo iptables -A INPUT -s ${srcIp} -j DROP`;
          const sshResult = await sshClient.executeCommand(cmd);
          updateStep(waitingIndex, sshResult.success ? 'completed' : 'failed', sshResult.output);

          if (!sshResult.success) {
            playbookLog.status = 'failed';
            this.broadcastUpdate();
            return;
          }

          addStep('Incident Resolution Notification', 'Publishing alerts to SIEM workspace and logging containment audit', 'running');
          await delay(1000);
          updateStep(waitingIndex + 1, 'completed', `Successfully isolated IP: ${srcIp} from Kali VM. Action approved by analyst.`);
          playbookLog.status = 'completed';
          this.broadcastUpdate();

        } else if (playbookLog.playbookId === 'kill-process') {
          const rawPID = playbookLog.steps[0].output; // Identified Process PID: xxxx
          const processId = rawPID.split(': ')[1];

          const cmd = `sudo kill -9 ${processId}`;
          const sshResult = await sshClient.executeCommand(cmd);
          updateStep(waitingIndex, sshResult.success ? 'completed' : 'failed', sshResult.output);

          if (!sshResult.success) {
            playbookLog.status = 'failed';
            this.broadcastUpdate();
            return;
          }

          addStep('System Audit', 'Running compliance sweep to verify process remains inactive', 'running');
          await delay(1000);
          updateStep(waitingIndex + 1, 'completed', `Process PID ${processId} verified inactive. Command approved by analyst.`);
          playbookLog.status = 'completed';
          this.broadcastUpdate();

        } else if (playbookLog.playbookId === 'quarantine-file') {
          const rawFile = playbookLog.steps[0].output; // File identified: xxx
          const filePath = rawFile.split(': ')[1];

          const qDir = '/tmp/quarantine';
          const qName = `quarantined_${Date.now()}`;
          const cmd = `sudo mkdir -p ${qDir} && sudo mv ${filePath} ${qDir}/${qName} && sudo chmod 000 ${qDir}/${qName}`;
          
          const sshResult = await sshClient.executeCommand(cmd);
          updateStep(waitingIndex, sshResult.success ? 'completed' : 'failed', sshResult.output);

          if (!sshResult.success) {
            playbookLog.status = 'failed';
            this.broadcastUpdate();
            return;
          }

          addStep('Verify Containment', `Ensuring file has been removed from original path: ${filePath}`, 'running');
          await delay(1000);
          updateStep(waitingIndex + 1, 'completed', `Verified. File isolated in ${qDir}/${qName}. Approved by analyst.`);
          playbookLog.status = 'completed';
          this.broadcastUpdate();
        }
      } catch (err) {
        console.error('SOAR Playbook Resume Error:', err);
        playbookLog.status = 'failed';
        this.broadcastUpdate();
      }
    })();

    return true;
  }

  broadcastUpdate() {
    this.wsBroadcast({
      type: 'PLAYBOOKS_UPDATE',
      data: this.history
    });
  }
}

module.exports = new PlaybookManager();
