// server.js
// Express API + WebSockets entrypoint for the SIEM/SOAR system

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const riskEngine = require('./riskEngine');
const playbookManager = require('./playbookManager');
const simulator = require('./simulator');
const sshClient = require('./sshClient');

const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Setup HTTP server
const server = http.createServer(app);

// Setup WebSocket Server
const wss = new WebSocket.Server({ server });

// Broadcast utility function
const broadcast = (data) => {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Hook up broadcasts inside engines
playbookManager.setBroadcastCallback(broadcast);
simulator.setBroadcastCallback(broadcast);

// WebSocket connection lifecycle
wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected.');
  
  // Push initial state to newly connected dashboard
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    data: {
      alerts: simulator.getAlertsHistory(),
      riskSummary: riskEngine.getRiskSummary(),
      playbookHistory: playbookManager.getHistory(),
      simulatorRunning: simulator.isRunning,
      sshConfigured: sshClient.isActive
    }
  }));

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected.');
  });
});

// REST API Endpoints

// 1. Webhook endpoint to receive real Wazuh alerts
app.post('/api/alerts', async (req, res) => {
  try {
    const alert = req.body;
    if (!alert || Object.keys(alert).length === 0) {
      return res.status(400).json({ error: 'Empty alert payload' });
    }
    
    console.log(`[SIEM Webhook] Ingested alert: ${alert.rule?.description || 'Unknown'}`);
    await simulator.handleIncomingAlert(alert);
    res.status(200).json({ success: true, message: 'Alert processed' });
  } catch (err) {
    console.error('[SIEM Webhook] Error processing alert:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch history of alerts
app.get('/api/alerts', (req, res) => {
  res.json(simulator.getAlertsHistory());
});

// 3. Fetch user/host/IP risk profiles
app.get('/api/risk', (req, res) => {
  res.json(riskEngine.getRiskSummary());
});

// 4. Fetch history of playbook executions
app.get('/api/playbooks', (req, res) => {
  res.json(playbookManager.getHistory());
});

// 5. Trigger a playbook manual run
app.post('/api/playbooks/trigger', async (req, res) => {
  const { playbookId, alertId, autoRemediate } = req.body;
  const alert = simulator.getAlertsHistory().find(a => a.id === alertId);
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  try {
    const runId = await playbookManager.triggerPlaybook(playbookId, alert, autoRemediate);
    res.json({ success: true, runId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Manual analyst approval to execute a paused playbook remediation step
app.post('/api/playbooks/approve', async (req, res) => {
  const { runId } = req.body;
  if (!runId) {
    return res.status(400).json({ error: 'Missing runId' });
  }

  console.log(`[SOAR Engine] Analyst approved remediation for playbook run: ${runId}`);
  const success = await playbookManager.approvePlaybook(runId);
  
  if (success) {
    res.json({ success: true, message: 'Remediation approved and running' });
  } else {
    res.status(400).json({ error: 'Failed to approve. Playbook may not be in paused state.' });
  }
});

// 7. Toggle simulator state
app.post('/api/simulator/toggle', (req, res) => {
  const { enable } = req.body;
  if (enable) {
    simulator.start();
  } else {
    simulator.stop();
  }
  
  broadcast({
    type: 'SIMULATOR_STATE_UPDATE',
    data: { running: simulator.isRunning }
  });
  
  res.json({ success: true, running: simulator.isRunning });
});

// 8. System Status
app.get('/api/status', (req, res) => {
  res.json({
    simulatorRunning: simulator.isRunning,
    sshConfigured: sshClient.isActive,
    sshTarget: sshClient.config.host || 'None (SIMULATED)',
    uptime: process.uptime()
  });
});

// Start the server
server.listen(port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Gurucul SIEM/SOAR Backend active on port ${port}`);
  console.log(`🌐 WebSocket server mounted at ws://localhost:${port}`);
  console.log(`====================================================`);
  
  // Start the attack simulator automatically on startup
  simulator.start(35000);
});
