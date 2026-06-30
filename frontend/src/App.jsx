// App.jsx
import React, { useState, useEffect } from 'react';
import { Shield, Terminal, Server, Cpu, Activity, Info } from 'lucide-react';

import Dashboard from './components/Dashboard';
import TriageCenter from './components/TriageCenter';
import EntityExplorer from './components/EntityExplorer';
import PlaybookVisualizer from './components/PlaybookVisualizer';

export default function App() {
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'triage' | 'ueba' | 'playbooks'
  
  // Real-time state
  const [alerts, setAlerts] = useState([]);
  const [riskSummary, setRiskSummary] = useState({ hosts: [], users: [], ips: [] });
  const [playbookHistory, setPlaybookHistory] = useState([]);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [sshConfigured, setSshConfigured] = useState(false);
  const [connected, setConnected] = useState(false);

  // Setup WebSocket connection
  useEffect(() => {
    const wsUri = `ws://${window.location.hostname}:5001`;
    console.log(`Connecting to SOAR WebSocket at ${wsUri}`);
    
    let socket;
    let reconnectTimeout;

    const connect = () => {
      socket = new WebSocket(wsUri);

      socket.onopen = () => {
        console.log('[WebSocket] Connection established.');
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // console.log('[WebSocket] Message received:', message.type);

          switch (message.type) {
            case 'INITIAL_STATE':
              setAlerts(message.data.alerts || []);
              setRiskSummary(message.data.riskSummary || { hosts: [], users: [], ips: [] });
              setPlaybookHistory(message.data.playbookHistory || []);
              setSimulatorRunning(message.data.simulatorRunning || false);
              setSshConfigured(message.data.sshConfigured || false);
              break;
              
            case 'NEW_ALERT':
              setAlerts(prev => {
                const index = prev.findIndex(a => a.id === message.data.id);
                if (index !== -1) {
                  // Update existing alert (e.g. adding AI analysis updates)
                  const updated = [...prev];
                  updated[index] = message.data;
                  return updated;
                }
                // Prepend new alert
                return [message.data, ...prev];
              });
              break;

            case 'RISK_UPDATE':
              setRiskSummary(message.data);
              break;

            case 'PLAYBOOKS_UPDATE':
              setPlaybookHistory(message.data);
              break;

            case 'SIMULATOR_STATE_UPDATE':
              setSimulatorRunning(message.data.running);
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse payload:', err);
        }
      };

      socket.onclose = () => {
        console.log('[WebSocket] Disconnected. Retrying in 3s...');
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('[WebSocket] Error occurred:', err.message);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Controls API Calls
  const toggleSimulator = async () => {
    try {
      const response = await fetch(`http://${window.location.hostname}:5001/api/simulator/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: !simulatorRunning })
      });
      const data = await response.json();
      setSimulatorRunning(data.running);
    } catch (err) {
      console.error('Failed to toggle threat simulator:', err);
    }
  };

  const approvePlaybook = async (runId) => {
    try {
      await fetch(`http://${window.location.hostname}:5001/api/playbooks/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId })
      });
    } catch (err) {
      console.error('Failed to approve playbook:', err);
    }
  };

  const triggerManualPlaybook = async (playbookId, alertId) => {
    try {
      await fetch(`http://${window.location.hostname}:5001/api/playbooks/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbookId, alertId, autoRemediate: false })
      });
      setTab('playbooks'); // Go to playbooks visualizer to watch it run
    } catch (err) {
      console.error('Failed to trigger playbook:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Premium Top Bar */}
      <header className="glass-panel" style={{ margin: '16px 24px 0 24px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
        
        {/* Title / Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="glass-panel glow-border-cyan pulse-cyan" style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center' }}>
            <Shield className="text-cyber-cyan" size={24} />
          </div>
          <div>
            <h1 className="cyber-header" style={{ fontSize: '1.4rem', letterSpacing: '2px', color: 'var(--text-primary)' }}>REVEAL</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginTop: '-2px' }}>
              SIEM & SOAR Threat Command Center
            </span>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setTab('dashboard')} 
            className={`cyber-button ${tab === 'dashboard' ? 'glow-border-cyan' : ''}`}
            style={{ color: tab === 'dashboard' ? 'var(--cyber-cyan)' : 'var(--text-primary)', background: tab === 'dashboard' ? 'rgba(6, 182, 212, 0.05)' : '' }}
          >
            <Activity size={16} /> Dashboard
          </button>
          <button 
            onClick={() => setTab('triage')} 
            className={`cyber-button ${tab === 'triage' ? 'glow-border-cyan' : ''}`}
            style={{ color: tab === 'triage' ? 'var(--cyber-cyan)' : 'var(--text-primary)', background: tab === 'triage' ? 'rgba(6, 182, 212, 0.05)' : '' }}
          >
            <Terminal size={16} /> Triage Center
          </button>
          <button 
            onClick={() => setTab('ueba')} 
            className={`cyber-button ${tab === 'ueba' ? 'glow-border-cyan' : ''}`}
            style={{ color: tab === 'ueba' ? 'var(--cyber-cyan)' : 'var(--text-primary)', background: tab === 'ueba' ? 'rgba(6, 182, 212, 0.05)' : '' }}
          >
            <Server size={16} /> UEBA Entity Explorer
          </button>
          <button 
            onClick={() => setTab('playbooks')} 
            className={`cyber-button ${tab === 'playbooks' ? 'glow-border-cyan' : ''}`}
            style={{ color: tab === 'playbooks' ? 'var(--cyber-cyan)' : 'var(--text-primary)', background: tab === 'playbooks' ? 'rgba(6, 182, 212, 0.05)' : '' }}
          >
            <Cpu size={16} /> SOAR Playbooks
          </button>
        </nav>

        {/* Connection status indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? 'var(--cyber-green)' : 'var(--cyber-red)', display: 'inline-block', boxShadow: connected ? '0 0 8px var(--cyber-green)' : '0 0 8px var(--cyber-red)' }}></span>
            <span style={{ color: connected ? 'var(--cyber-green)' : 'var(--cyber-red)', fontWeight: '600', fontFamily: 'var(--font-cyber)', textTransform: 'uppercase' }}>
              {connected ? 'WS CONNECTED' : 'OFFLINE'}
            </span>
          </div>
        </div>

      </header>

      {/* Main Panel Content Area */}
      <main style={{ flexGrow: 1, padding: '24px' }}>
        
        {tab === 'dashboard' && (
          <Dashboard 
            alerts={alerts}
            riskSummary={riskSummary}
            playbookHistory={playbookHistory}
            simulatorRunning={simulatorRunning}
            sshConfigured={sshConfigured}
            toggleSimulator={toggleSimulator}
          />
        )}

        {tab === 'triage' && (
          <TriageCenter 
            alerts={alerts}
            playbookHistory={playbookHistory}
            approvePlaybook={approvePlaybook}
            triggerManualPlaybook={triggerManualPlaybook}
            setTab={setTab}
          />
        )}

        {tab === 'ueba' && (
          <EntityExplorer 
            riskSummary={riskSummary}
          />
        )}

        {tab === 'playbooks' && (
          <PlaybookVisualizer 
            playbookHistory={playbookHistory}
          />
        )}

      </main>

      {/* Modern cyber status footer */}
      <footer style={{ padding: '12px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={12} className="text-cyber-cyan" />
          <span>Gurucul SIEM/SOAR Reveal Dashboard Simulation Engine v1.0.0</span>
        </div>
        <span>LOCAL PROTOCOL ACTIVE // PORT 5001</span>
      </footer>

    </div>
  );
}
