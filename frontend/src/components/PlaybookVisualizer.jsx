// PlaybookVisualizer.jsx
import React, { useState } from 'react';
import { Cpu, CheckCircle2, XCircle, Play, AlertCircle, Clock, ChevronDown, ChevronRight, Terminal } from 'lucide-react';

export default function PlaybookVisualizer({ playbookHistory }) {
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [openLogIndex, setOpenLogIndex] = useState({});

  const currentRun = selectedRunId 
    ? playbookHistory.find(p => p.id === selectedRunId) 
    : playbookHistory[0];

  const toggleLog = (idx) => {
    setOpenLogIndex(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="text-cyber-green" size={20} />;
      case 'failed':
        return <XCircle className="text-cyber-red" size={20} />;
      case 'running':
        return <span style={{ border: '2.5px solid transparent', borderTopColor: 'var(--cyber-cyan)', width: '18px', height: '18px', borderRadius: '50%', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}></span>;
      case 'waiting':
        return <AlertCircle className="text-cyber-amber pulse-cyan" size={20} style={{ animationDuration: '1.5s' }} />;
      default:
        return <Clock className="text-secondary" size={20} style={{ opacity: 0.3 }} />;
    }
  };

  const getStepClass = (status) => {
    switch (status) {
      case 'completed': return 'glow-border-green';
      case 'running': return 'glow-border-cyan pulse-cyan';
      case 'failed': return 'glow-border-red';
      case 'waiting': return 'glow-border-amber';
      default: return '';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', minHeight: '500px' }}>
      
      {/* Left Pane: Playbook Runs Log */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="cyber-header" style={{ fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} className="text-cyber-green" />
          SOAR Orchestrator Log
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px' }}>
          {playbookHistory.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-secondary)' }}>
              <Cpu size={24} style={{ opacity: 0.15, marginBottom: '8px' }} />
              <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>No playbooks triggered yet.</p>
            </div>
          ) : (
            playbookHistory.map(p => {
              const isSelected = currentRun?.id === p.id;
              const statusColor = p.status === 'completed' ? 'var(--cyber-green)' : (p.status === 'failed' ? 'var(--cyber-red)' : 'var(--cyber-cyan)');
              
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedRunId(p.id); setOpenLogIndex({}); }}
                  className="glass-panel-hover"
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '6px',
                    background: isSelected ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--cyber-cyan)' : 'var(--border-color)',
                    padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%',
                    textAlign: 'left', color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.id}</span>
                    <span className="cyber-badge" style={{ 
                      fontSize: '0.65rem', color: statusColor, background: `${statusColor}10`, borderColor: `${statusColor}30` 
                    }}>
                      {p.status}
                    </span>
                  </div>
                  
                  <span className="cyber-header" style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
                    {p.playbookId.replace('-', ' ')}
                  </span>
                  
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                    {p.description}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Visual Playbook Flow */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {!currentRun ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <Cpu size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <h3 className="cyber-header" style={{ fontSize: '1rem', marginBottom: '4px' }}>Flowchart Engine</h3>
            <p style={{ fontSize: '0.85rem' }}>Select a SOAR execution log from the list to visualize playbook flow.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            
            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)' }}>
                  Active Execution Diagram
                </span>
                <h2 className="cyber-header" style={{ fontSize: '1.3rem', textTransform: 'capitalize', marginTop: '2px' }}>
                  Playbook: {currentRun.playbookId.replace('-', ' ')}
                </h2>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Run ID: {currentRun.id}</span>
                <span style={{ display: 'block', fontSize: '0.7rem', marginTop: '2px' }}>
                  Started: {new Date(currentRun.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Vertical Flow Diagram */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0px', overflowY: 'auto', maxHeight: '380px', paddingRight: '8px' }}>
              
              {currentRun.steps.map((step, idx) => {
                const isLogOpen = !!openLogIndex[idx];
                const nodeBorder = getStepClass(step.status);
                
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Node Card Row */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                      
                      {/* Left: Flow Icon & Line Anchor */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', minHeight: '60px' }}>
                        <div className={`glass-panel ${nodeBorder}`} style={{ padding: '6px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                          {getStepIcon(step.status)}
                        </div>
                        {idx < currentRun.steps.length - 1 && (
                          <div 
                            className={`playbook-connection-line ${step.status === 'completed' ? 'completed' : (step.status === 'running' ? 'active' : '')}`}
                            style={{ height: '36px', width: '2px' }}
                          ></div>
                        )}
                      </div>

                      {/* Right: Step Details */}
                      <div className="glass-panel" style={{ flexGrow: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span className="cyber-header" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{step.name}</span>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{step.description}</p>
                          </div>
                          
                          {/* Log expand toggle if output is present */}
                          {step.output && (
                            <button 
                              onClick={() => toggleLog(idx)}
                              style={{ background: 'none', border: 'none', color: 'var(--cyber-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}
                            >
                              {isLogOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              Logs
                            </button>
                          )}
                        </div>

                        {/* Collapsible Console Log Box */}
                        {isLogOpen && step.output && (
                          <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                              <Terminal size={12} />
                              <span>Execution Telemetry Console Output</span>
                            </div>
                            <pre className="terminal-text" style={{ whiteSpace: 'pre-wrap', color: 'var(--cyber-cyan)', fontSize: '0.75rem' }}>
                              {step.output}
                            </pre>
                          </div>
                        )}

                      </div>

                    </div>
                  </div>
                );
              })}

            </div>

          </div>
        )}
      </div>

      {/* Inline styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
