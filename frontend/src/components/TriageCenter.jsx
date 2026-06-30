// TriageCenter.jsx
import React, { useState } from 'react';
import { Terminal, ShieldAlert, Cpu, Check, Play, AlertOctagon, HelpCircle } from 'lucide-react';

export default function TriageCenter({ alerts, playbookHistory, approvePlaybook, triggerManualPlaybook, setTab }) {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailTab, setDetailTab] = useState('ai'); // 'ai' | 'json'

  const currentAlert = selectedAlert 
    ? alerts.find(a => a.id === selectedAlert.id) || selectedAlert
    : null;

  // Find associated playbook run status
  const associatedPlaybook = currentAlert && currentAlert.playbookRunId
    ? playbookHistory.find(p => p.id === currentAlert.playbookRunId)
    : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', minHeight: '520px' }}>
      
      {/* Left Pane: Alert Incident List */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="cyber-header" style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <span>Security Incidents Log</span>
          <span className="cyber-badge cyan">{alerts.length} Ingested</span>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '430px', paddingRight: '4px' }}>
          {alerts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', color: 'var(--text-secondary)' }}>
              <Terminal size={32} style={{ opacity: 0.15, marginBottom: '12px' }} />
              <p style={{ fontSize: '0.85rem' }}>No telemetry logs received.</p>
            </div>
          ) : (
            alerts.map(a => {
              const isSelected = selectedAlert?.id === a.id;
              const severity = a.rule?.level >= 10 ? 'red' : (a.rule?.level >= 6 ? 'amber' : 'cyan');
              
              // Get short description
              const description = a.rule?.description || 'Unknown Alert';
              
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAlert(a)}
                  className="glass-panel-hover"
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: isSelected ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--cyber-cyan)' : 'var(--border-color)',
                    padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span className={`cyber-badge ${severity}`} style={{ fontSize: '0.7rem' }}>
                      Level {a.rule?.level}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                    {description}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    <span>Host: {a.agent?.name || 'Local'}</span>
                    
                    {/* Playbook indicator icon */}
                    {a.playbookRunId && (
                      <span className="text-cyber-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Cpu size={12} className="pulse-cyan" />
                        SOAR
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Incident Details, AI, & Remediations */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {!currentAlert ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <AlertOctagon size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <h3 className="cyber-header" style={{ fontSize: '1rem', marginBottom: '4px' }}>Triage Workbench</h3>
            <p style={{ fontSize: '0.85rem' }}>Select an incident from the log feed to initiate analysis.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            
            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="cyber-badge red">Rule {currentAlert.rule?.id}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(currentAlert.timestamp).toLocaleString()}</span>
                </div>
                <h2 className="cyber-header" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {currentAlert.rule?.description}
                </h2>
              </div>

              {/* Status Badge */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>SOAR Orchestrator</span>
                <span className="cyber-header text-cyber-cyan" style={{ fontSize: '0.95rem' }}>
                  {associatedPlaybook 
                    ? `Playbook: ${associatedPlaybook.status.toUpperCase()}`
                    : 'Awaiting Action'}
                </span>
              </div>
            </div>

            {/* Grid: Triage Tabs (Left) + Remediation (Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px', flexGrow: 1 }}>
              
              {/* Triage Analytics Workspace */}
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
                  <button 
                    onClick={() => setDetailTab('ai')}
                    style={{
                      background: 'none', border: 'none', paddingBottom: '8px', cursor: 'pointer',
                      fontFamily: 'var(--font-cyber)', fontWeight: '600', fontSize: '0.85rem',
                      color: detailTab === 'ai' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                      borderBottom: detailTab === 'ai' ? '2px solid var(--cyber-cyan)' : '2px solid transparent'
                    }}
                  >
                    AI Security Analyst
                  </button>
                  <button 
                    onClick={() => setDetailTab('json')}
                    style={{
                      background: 'none', border: 'none', paddingBottom: '8px', cursor: 'pointer',
                      fontFamily: 'var(--font-cyber)', fontWeight: '600', fontSize: '0.85rem',
                      color: detailTab === 'json' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                      borderBottom: detailTab === 'json' ? '2px solid var(--cyber-cyan)' : '2px solid transparent'
                    }}
                  >
                    Raw Telemetry (JSON)
                  </button>
                </div>

                {/* Tab Content */}
                <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '270px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '16px' }}>
                  
                  {detailTab === 'ai' && (
                    <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                      {currentAlert.aiAnalysis?.status === 'analyzing' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                          <span style={{ border: '2px solid transparent', borderTopColor: 'var(--cyber-cyan)', width: '16px', height: '16px', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></span>
                          <span className="terminal-text">Gemini AI model performing correlation and building remediation playbook...</span>
                        </div>
                      ) : currentAlert.aiAnalysis?.text ? (
                        /* Parse markdown paragraphs simply */
                        currentAlert.aiAnalysis.text.split('\n').map((line, index) => {
                          if (line.startsWith('### ')) {
                            return <h3 key={index} className="cyber-header text-cyber-cyan" style={{ fontSize: '0.9rem', marginTop: '16px', marginBottom: '8px' }}>{line.slice(4)}</h3>;
                          }
                          if (line.startsWith('* ')) {
                            return <li key={index} style={{ marginLeft: '16px', marginBottom: '4px' }}>{line.slice(2)}</li>;
                          }
                          if (line.trim() === '') return <div key={index} style={{ height: '8px' }}></div>;
                          // Format inline code
                          const parts = line.split('`');
                          if (parts.length > 1) {
                            return (
                              <p key={index} style={{ marginBottom: '8px' }}>
                                {parts.map((p, i) => i % 2 === 1 ? <code key={i} style={{ fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--cyber-red)' }}>{p}</code> : p)}
                              </p>
                            );
                          }
                          return <p key={index} style={{ marginBottom: '8px' }}>{line}</p>;
                        })
                      ) : (
                        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <HelpCircle size={16} />
                          <span>No intelligence summary loaded.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {detailTab === 'json' && (
                    <pre className="terminal-text" style={{ whiteSpace: 'pre-wrap', color: 'var(--cyber-green)' }}>
                      {JSON.stringify(currentAlert, null, 2)}
                    </pre>
                  )}

                </div>
              </div>

              {/* SOAR Remediation Panel */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyBlock: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
                <h3 className="cyber-header" style={{ fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} className="text-cyber-cyan" />
                  SOAR Actions
                </h3>

                {/* If playbook is currently running/paused */}
                {associatedPlaybook ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Active Playbook</span>
                      <span style={{ fontWeight: '600', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                        {associatedPlaybook.playbookId.replace('-', ' ')}
                      </span>
                      
                      <span style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '12px', marginBottom: '4px' }}>Current Step</span>
                      <span className="text-cyber-cyan" style={{ fontFamily: 'var(--font-mono)' }}>
                        {associatedPlaybook.steps.find(s => s.status === 'running' || s.status === 'waiting')?.name || 'Playbook complete'}
                      </span>
                    </div>

                    {/* Pending Manual Approval Section */}
                    {associatedPlaybook.status === 'paused' && (
                      <div className="glow-border-red pulse-red" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.3)', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                        <span className="cyber-header text-cyber-red" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px' }}>
                          ⚠️ Authorization Required
                        </span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          Containment action requires operator approval to execute.
                        </p>
                        
                        {/* Command box */}
                        <div className="terminal-text" style={{ background: 'rgba(0,0,0,0.4)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--cyber-cyan)', wordBreak: 'break-all', marginBottom: '10px' }}>
                          {associatedPlaybook.playbookId === 'block-ip' && `iptables -A INPUT -s ${currentAlert.data?.srcip} -j DROP`}
                          {associatedPlaybook.playbookId === 'kill-process' && `kill -9 ${currentAlert.data?.pid}`}
                          {associatedPlaybook.playbookId === 'quarantine-file' && `mv ${currentAlert.syscheck?.path} /tmp/quarantine`}
                        </div>

                        <button 
                          className="cyber-button" 
                          style={{ width: '100%', borderColor: 'var(--cyber-green)', color: 'var(--cyber-green)', fontSize: '0.75rem', justifyContent: 'center' }}
                          onClick={() => approvePlaybook(associatedPlaybook.id)}
                        >
                          <Check size={12} /> Approve Remediation
                        </button>
                      </div>
                    )}

                    <button 
                      className="cyber-button" 
                      style={{ width: '100%', fontSize: '0.75rem', justifyContent: 'center', marginTop: '12px' }}
                      onClick={() => setTab('playbooks')}
                    >
                      View Playbook Flow
                    </button>
                  </div>
                ) : (
                  // Manual trigger options
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      No playbook auto-launched for this severity level. Run a manual command playbook:
                    </p>
                    
                    <button 
                      disabled={!currentAlert.data?.srcip}
                      onClick={() => triggerManualPlaybook('block-ip', currentAlert.id)}
                      className="cyber-button"
                      style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', width: '100%' }}
                    >
                      <Play size={10} /> Block Source IP
                    </button>

                    <button 
                      disabled={!currentAlert.data?.pid}
                      onClick={() => triggerManualPlaybook('kill-process', currentAlert.id)}
                      className="cyber-button"
                      style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', width: '100%' }}
                    >
                      <Play size={10} /> Kill Host Process
                    </button>

                    <button 
                      disabled={!currentAlert.syscheck?.path && !currentAlert.data?.filename}
                      onClick={() => triggerManualPlaybook('quarantine-file', currentAlert.id)}
                      className="cyber-button"
                      style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', width: '100%' }}
                    >
                      <Play size={10} /> Quarantine File
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}
      </div>

      {/* Embedded CSS spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
