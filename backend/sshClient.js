// sshClient.js
// Manages SSH connection to the Kali VM to run remediation commands

const { Client } = require('ssh2');

class SSHClient {
  constructor() {
    this.config = {
      host: process.env.KALI_SSH_HOST || '',
      port: parseInt(process.env.KALI_SSH_PORT || '22'),
      username: process.env.KALI_SSH_USER || '',
      password: process.env.KALI_SSH_PASSWORD || '',
      // Optional: privateKey: process.env.KALI_SSH_KEY_PATH ? require('fs').readFileSync(process.env.KALI_SSH_KEY_PATH) : undefined
    };
    this.isActive = false;
    this.validateConfig();
  }

  validateConfig() {
    if (this.config.host && this.config.username && (this.config.password || this.config.privateKey)) {
      this.isActive = true;
      console.log(`[SSH] Configuration found. Targeted host: ${this.config.host}`);
    } else {
      this.isActive = false;
      console.log('[SSH] Credentials not fully configured. Operating in SIMULATION / DRY-RUN mode.');
    }
  }

  // Execute a command on Kali VM. Fallback to simulation if config is missing or connection fails.
  executeCommand(command) {
    return new Promise((resolve) => {
      if (!this.isActive) {
        // Simulated execution (Dry-run)
        console.log(`[SSH SIMULATION] Executing command: "${command}"`);
        setTimeout(() => {
          let mockOutput = `[SIMULATION] Executed: ${command}\n`;
          if (command.includes('iptables')) {
            mockOutput += `Chain INPUT (policy ACCEPT)\ntarget     prot opt source               destination         \nDROP       all  --  [BLOCKED_IP]        0.0.0.0/0           `;
          } else if (command.includes('kill')) {
            mockOutput += `Process terminated successfully.`;
          } else if (command.includes('mv')) {
            mockOutput += `File moved to /tmp/quarantine successfully. Permissions set to 000.`;
          } else {
            mockOutput += `Command completed successfully (exit code 0)`;
          }
          resolve({ success: true, output: mockOutput, simulated: true });
        }, 1000);
        return;
      }

      const conn = new Client();
      conn.on('ready', () => {
        console.log(`[SSH] Connected to Kali VM at ${this.config.host}`);
        let outputData = '';
        let errorData = '';

        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return resolve({ success: false, output: err.message, simulated: false });
          }

          stream.on('close', (code, signal) => {
            conn.end();
            resolve({
              success: code === 0,
              output: code === 0 ? outputData : errorData || `Exited with code ${code}`,
              simulated: false
            });
          }).on('data', (data) => {
            outputData += data.toString();
          }).stderr.on('data', (data) => {
            errorData += data.toString();
          });
        });
      }).on('error', (err) => {
        console.error(`[SSH] Connection failed: ${err.message}. Falling back to SIMULATION mode.`);
        // Fallback execution
        let mockOutput = `[SSH FALLBACK] Connection failed (${err.message}). Simulated Output:\n`;
        mockOutput += `Executed: ${command}\nStatus: Completed (Simulated)`;
        resolve({ success: true, output: mockOutput, simulated: true });
      }).connect(this.config);
    });
  }
}

module.exports = new SSHClient();
