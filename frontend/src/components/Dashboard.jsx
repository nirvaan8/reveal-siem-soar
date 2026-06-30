// Dashboard.jsx
import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity, Terminal, Server, Users, Globe } from 'lucide-react';

export default function Dashboard({ alerts, riskSummary, playbookHistory, simulatorRunning, sshConfigured, toggleSimulator }) {
  // Calculate stats
  const totalAlerts = alerts.length;
  const criticalAlertsCount = alerts.filter(a => (a.rule?.level || 0) >= 10).length;
  const activePlaybooksCount = playbookHistory.filter(p => p.status === 'running' || p.status === 'paused').length;
  
  // Calculate average security health score (100 - average risk score of hosts)
  const hosts = riskSummary.hosts || [];
  const averageHostRisk = hosts.length > 0 
    ? hosts.reduce((sum, h) => sum + h.riskScore, 0) / hosts.length
    : 0;
  
  // Round to nearest integer and subtract from 100 to get a Health Score (0-100)
  const healthScore = Math.max(0, Math.round(100 - averageHostRisk));
  
  // Choose color code for health score
  let healthColor = 'text-cyber-green';
  let healthBorder = 'glow-border-green';
  if (healthScore < 50) {
    healthColor = 'text-cyber-red';
    healthBorder = 'glow-border-red';
  } else if (healthScore < 80) {
    healthColor = 'text-cyber-amber';
    healthBorder = 'glow-border-amber';
  }

  // Calculate SVG stroke offset for Health Ring (radius=50, circumference=314.16)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Simulation Banner */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--cyber-cyan)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Activity className="text-cyber-cyan pulse-cyan" size={24} />
          <div>
            <h3 className="cyber-header" style={{ fontSize: '1.1rem' }}>Cyber Threat Environment Simulator</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
              {simulatorRunning 
                ? 'Threat generator is broadcasting simulated Wazuh logs in real-time.' 
                : 'Threat generator is paused. Only receiving manual webhook logs.'}
            </p>
          </div>
        </div>
        <button 
          onClick={toggleSimulator} 
          className="cyber-button"
          style={{ borderColor: simulatorRunning ? 'var(--cyber-red)' : 'var(--cyber-green)' }}
        >
          {simulatorRunning ? 'Pause Simulator' : 'Start Simulator'}
        </button>
      </div>

      {/* Hero Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Health Score Card */}
        <div className={`glass-panel ${healthBorder}`} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div className="threat-dial-container">
            <svg width="120" height="120" className="threat-dial-svg">
              <circle 
                cx="60" cy="60" r={radius} 
                fill="transparent" 
                stroke="var(--bg-tertiary)" 
                strokeWidth="10" 
              />
              <circle 
                cx="60" cy="60" r={radius} 
                fill="transparent" 
                stroke={healthScore < 50 ? 'var(--cyber-red)' : (healthScore < 80 ? 'var(--cyber-amber)' : 'var(--cyber-green)')} 
                strokeWidth="10" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className={`cyber-header ${healthColor}`} style={{ fontSize: '1.8rem' }}>{healthScore}%</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Health</span>
            </div>
          </div>
          <div>
            <h4 className="cyber-header" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Security Posture</h4>
            <p style={{ fontSize: '0.85rem', marginTop: '6px', color: 'var(--text-primary)' }}>
              {healthScore > 80 ? 'System operational. Risk level nominal.' : (healthScore > 50 ? 'Elevated risk. Inspect recent alerts.' : 'Critical incident active. Initiate containment!')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <span className={`cyber-badge ${sshConfigured ? 'green' : 'amber'}`}>
                SSH Connection: {sshConfigured ? 'ACTIVE' : 'SIMULATED'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Alerts Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 className="cyber-header" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Alerts Ingested</h4>
              <span className="cyber-header text-cyber-cyan" style={{ fontSize: '2.2rem', display: 'block', marginTop: '8px' }}>{totalAlerts}</span>
            </div>
            <div className="glass-panel" style={{ padding: '8px', background: 'rgba(6, 182, 212, 0.05)' }}>
              <Terminal size={20} className="text-cyber-cyan" />
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Real-time Stream active</span>
            <span className="text-cyber-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyber-green)', display: 'inline-block' }}></span>
              Connected
            </span>
          </div>
        </div>

        {/* Critical Threats Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 className="cyber-header" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Critical Incidents</h4>
              <span className={`cyber-header ${criticalAlertsCount > 0 ? 'text-cyber-red pulse-red' : 'text-cyber-green'}`} style={{ fontSize: '2.2rem', display: 'inline-block', marginTop: '8px', padding: '0 4px', borderRadius: '4px' }}>
                {criticalAlertsCount}
              </span>
            </div>
            <div className="glass-panel" style={{ padding: '8px', background: 'rgba(244, 63, 94, 0.05)' }}>
              <ShieldAlert size={20} className={criticalAlertsCount > 0 ? 'text-cyber-red' : 'text-cyber-green'} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Severity Level &ge; 10</span>
            <span style={{ color: criticalAlertsCount > 0 ? 'var(--cyber-red)' : 'var(--text-secondary)' }}>
              {criticalAlertsCount > 0 ? 'Action required!' : 'No critical threats'}
            </span>
          </div>
        </div>

        {/* SOAR Playbooks Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 className="cyber-header" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active SOAR Playbooks</h4>
              <span className="cyber-header text-cyber-green" style={{ fontSize: '2.2rem', display: 'block', marginTop: '8px' }}>{activePlaybooksCount}</span>
            </div>
            <div className="glass-panel" style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.05)' }}>
              <ShieldCheck size={20} className="text-cyber-green" />
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Total Executions: {playbookHistory.length}</span>
            <span className="text-cyber-cyan">{playbookHistory.filter(p => p.status === 'completed').length} Resolved</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Entity Risk List + Live Console */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Entity Risk Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 className="cyber-header" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} className="text-cyber-cyan" />
            Gurucul-Style Risk Scores (Top Threats)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Hosts */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={12} />
                Hosts
              </h4>
              {hosts.slice(0, 3).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '8px 0' }}>No active host threats detected.</p>
              ) : (
                hosts.slice(0, 3).map(h => (
                  <div key={h.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{h.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '80px', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${h.riskScore}%`, height: '100%', background: h.riskScore > 75 ? 'var(--cyber-red)' : (h.riskScore > 40 ? 'var(--cyber-amber)' : 'var(--cyber-green)') }}></div>
                      </div>
                      <span className={`cyber-header ${h.riskScore > 75 ? 'text-cyber-red' : (h.riskScore > 40 ? 'text-cyber-amber' : 'text-cyber-green')}`} style={{ fontSize: '0.9rem', width: '28px', textAlign: 'right' }}>
                        {h.riskScore}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Top IPs */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={12} />
                External IPs
              </h4>
              {riskSummary.ips?.slice(0, 3).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '8px 0' }}>No anomalous IP interactions.</p>
              ) : (
                riskSummary.ips.slice(0, 3).map(ip => (
                  <div key={ip.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{ip.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '80px', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${ip.riskScore}%`, height: '100%', background: ip.riskScore > 75 ? 'var(--cyber-red)' : (ip.riskScore > 40 ? 'var(--cyber-amber)' : 'var(--cyber-green)') }}></div>
                      </div>
                      <span className={`cyber-header ${ip.riskScore > 75 ? 'text-cyber-red' : (ip.riskScore > 40 ? 'text-cyber-amber' : 'text-cyber-green')}`} style={{ fontSize: '0.9rem', width: '28px', textAlign: 'right' }}>
                        {ip.riskScore}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Top Users */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={12} />
                Users
              </h4>
              {riskSummary.users?.slice(0, 3).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '8px 0' }}>No user account risk spikes.</p>
              ) : (
                riskSummary.users.slice(0, 3).map(u => (
                  <div key={u.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{u.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '80px', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${u.riskScore}%`, height: '100%', background: u.riskScore > 75 ? 'var(--cyber-red)' : (u.riskScore > 40 ? 'var(--cyber-amber)' : 'var(--cyber-green)') }}></div>
                      </div>
                      <span className={`cyber-header ${u.riskScore > 75 ? 'text-cyber-red' : (u.riskScore > 40 ? 'text-cyber-amber' : 'text-cyber-green')}`} style={{ fontSize: '0.9rem', width: '28px', textAlign: 'right' }}>
                        {u.riskScore}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

        {/* Live Alerts Stream Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="cyber-header" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} className="text-cyber-red" />
            Live Incident Stream
          </h3>
          
          <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '310px', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {alerts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)' }}>
                <Activity size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p style={{ fontSize: '0.85rem' }}>Awaiting incoming security telemetry logs...</p>
              </div>
            ) : (
              alerts.slice(0, 10).map((alert) => {
                const severity = alert.rule?.level >= 10 ? 'red' : (alert.rule?.level >= 6 ? 'amber' : 'cyan');
                return (
                  <div key={alert.id} className={`glass-panel-hover`} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className={`cyber-badge ${severity}`}>Wazuh Rule: {alert.rule?.id}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>{alert.rule?.description}</p>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      <span>Host: {alert.agent?.name || 'Local'}</span>
                      {alert.data?.srcip && <span>IP: {alert.data.srcip}</span>}
                      {alert.data?.dstuser && <span>User: {alert.data.dstuser}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
