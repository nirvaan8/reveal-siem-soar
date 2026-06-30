// EntityExplorer.jsx
import React, { useState } from 'react';
import { Server, Users, Globe, ShieldAlert, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function EntityExplorer({ riskSummary }) {
  const [activeTab, setActiveTab] = useState('hosts'); // 'hosts' | 'users' | 'ips'
  const [selectedEntity, setSelectedEntity] = useState(null);

  const getEntities = () => {
    return riskSummary[activeTab] || [];
  };

  const entities = getEntities();

  // If selectedEntity is not null, find its latest data in the active list
  const currentEntityData = selectedEntity 
    ? riskSummary[activeTab]?.find(e => e.name === selectedEntity.name) || selectedEntity
    : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', minHeight: '500px' }}>
      
      {/* Sidebar: Entity Selection List */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => { setActiveTab('hosts'); setSelectedEntity(null); }}
            style={{ 
              background: activeTab === 'hosts' ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none', color: activeTab === 'hosts' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
              padding: '8px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
            }}
          >
            <Server size={12} />
            Hosts
          </button>
          <button 
            onClick={() => { setActiveTab('ips'); setSelectedEntity(null); }}
            style={{ 
              background: activeTab === 'ips' ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none', color: activeTab === 'ips' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
              padding: '8px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
            }}
          >
            <Globe size={12} />
            IPs
          </button>
          <button 
            onClick={() => { setActiveTab('users'); setSelectedEntity(null); }}
            style={{ 
              background: activeTab === 'users' ? 'var(--bg-tertiary)' : 'transparent',
              border: 'none', color: activeTab === 'users' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
              padding: '8px 0', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px'
            }}
          >
            <Users size={12} />
            Users
          </button>
        </div>

        {/* Entities Search Header */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
          Active Threat Scoring List
        </div>

        {/* Entity List */}
        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px' }}>
          {entities.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-secondary)' }}>
              <TrendingUp size={24} style={{ opacity: 0.15, marginBottom: '8px' }} />
              <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>No risk profiling logs generated yet.</p>
            </div>
          ) : (
            entities.map(e => {
              const isSelected = selectedEntity?.name === e.name;
              const severityColor = e.riskScore > 75 ? 'var(--cyber-red)' : (e.riskScore > 40 ? 'var(--cyber-amber)' : 'var(--cyber-green)');
              return (
                <button
                  key={e.name}
                  onClick={() => setSelectedEntity(e)}
                  className="glass-panel-hover"
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: isSelected ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--cyber-cyan)' : 'var(--border-color)',
                    padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%',
                    textAlign: 'left', color: 'var(--text-primary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    {activeTab === 'hosts' && <Server size={14} className="text-cyber-cyan" />}
                    {activeTab === 'ips' && <Globe size={14} className="text-cyber-cyan" />}
                    {activeTab === 'users' && <Users size={14} className="text-cyber-cyan" />}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.name}
                    </span>
                  </div>
                  <span 
                    className="cyber-header" 
                    style={{ 
                      fontSize: '0.85rem', color: severityColor, background: 'rgba(0,0,0,0.2)', 
                      padding: '2px 6px', borderRadius: '4px', border: `1px solid ${severityColor}40` 
                    }}
                  >
                    {e.riskScore}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Panel: Entity Detail Analysis */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {!currentEntityData ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <ShieldAlert size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <h3 className="cyber-header" style={{ fontSize: '1rem', marginBottom: '4px' }}>Behavioral Profiling Engine</h3>
            <p style={{ fontSize: '0.85rem' }}>Select an entity from the sidebar to audit security risk vectors.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
            
            {/* Entity Header Information */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)' }}>
                  Active Audit Target ({activeTab.slice(0, -1)})
                </span>
                <h2 className="cyber-header text-cyber-cyan" style={{ fontSize: '1.5rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {currentEntityData.name}
                </h2>
              </div>
              
              {/* Dynamic Score Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Current Risk Index</span>
                  <span className="cyber-header" style={{ fontSize: '1.1rem', color: currentEntityData.riskScore > 75 ? 'var(--cyber-red)' : (currentEntityData.riskScore > 40 ? 'var(--cyber-amber)' : 'var(--cyber-green)') }}>
                    {currentEntityData.riskScore > 75 ? 'CRITICAL RISK' : (currentEntityData.riskScore > 40 ? 'ELEVATED RISK' : 'LOW RISK')}
                  </span>
                </div>
                <div 
                  className="cyber-header"
                  style={{
                    fontSize: '2rem',
                    color: currentEntityData.riskScore > 75 ? 'var(--cyber-red)' : (currentEntityData.riskScore > 40 ? 'var(--cyber-amber)' : 'var(--cyber-green)'),
                    background: 'rgba(255,255,255,0.02)',
                    padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-color)'
                  }}
                >
                  {currentEntityData.riskScore}
                </div>
              </div>
            </div>

            {/* Risk Contribution Chart / Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              
              {/* Event Timeline */}
              <div>
                <h3 className="cyber-header" style={{ fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} className="text-cyber-cyan" />
                  Risk Vector Timeline
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {currentEntityData.events?.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No anomalous security logs registered against this entity.</p>
                  ) : (
                    currentEntityData.events.map((event, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: event.level >= 10 ? 'var(--cyber-red)' : 'var(--cyber-amber)', marginTop: '4px' }}></span>
                          {idx < currentEntityData.events.length - 1 && <span style={{ width: '2px', flexGrow: 1, background: 'var(--bg-tertiary)', margin: '4px 0' }}></span>}
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{event.description}</span>
                            <span className="cyber-header text-cyber-red" style={{ fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(244,63,94,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                              +{event.increment} Risk
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span>Rule ID: {event.ruleId}</span>
                            <span>Severity: {event.level}</span>
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Behavior Profile Breakdown */}
              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)' }}>
                <h3 className="cyber-header" style={{ fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} className="text-cyber-amber" />
                  Audit Summary
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Entity Status</span>
                    <span className="cyber-header" style={{ color: currentEntityData.riskScore > 75 ? 'var(--cyber-red)' : (currentEntityData.riskScore > 40 ? 'var(--cyber-amber)' : 'var(--cyber-green)') }}>
                      {currentEntityData.riskScore > 75 ? '⚠️ QUARANTINE RECOMMENDED' : (currentEntityData.riskScore > 40 ? '🔍 ACTIVE WATCHLIST' : '✅ COMPLIANT')}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Correlated Events</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {currentEntityData.events?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Last Telemetry Ping</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      {currentEntityData.lastUpdated ? new Date(currentEntityData.lastUpdated).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Remediation Control</span>
                    <button 
                      disabled={currentEntityData.riskScore === 0}
                      className="cyber-button danger" 
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}
                      onClick={() => alert(`Isolating ${currentEntityData.name}. Manual SOAR request dispatched.`)}
                    >
                      Isolate Entity
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}
