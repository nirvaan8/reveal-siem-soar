// riskEngine.js
// Inspired by Gurucul UEBA - tracks user and entity risk scores based on incoming alerts

class RiskEngine {
  constructor() {
    this.hosts = {}; // Hostname -> { riskScore, events: [], lastUpdated }
    this.users = {}; // Username -> { riskScore, events: [], lastUpdated }
    this.ips = {};   // IP Address -> { riskScore, events: [], lastUpdated }
    
    // Periodically decay risk scores to simulate risk aging
    setInterval(() => this.decayRiskScores(), 10000);
  }

  // Process a Wazuh alert and update risk scores
  processAlert(alert) {
    const rule = alert.rule || {};
    const level = rule.level || 0; // Wazuh rule level (0-15)
    const ruleDesc = rule.description || "Unknown security event";
    const timestamp = alert.timestamp || new Date().toISOString();
    
    // Calculate risk increment (Wazuh rule level 0-15 mapped to risk points)
    const riskIncrement = Math.min(level * 6.5, 100); 

    if (riskIncrement === 0) return null;

    const riskEvent = {
      description: ruleDesc,
      ruleId: rule.id,
      level: level,
      increment: Math.round(riskIncrement),
      timestamp: timestamp
    };

    const updates = { hosts: [], users: [], ips: [] };

    // 1. Evaluate Host Risk
    const hostname = alert.agent?.name || (alert.manager?.name !== "localhost" ? alert.manager?.name : null) || "unknown-host";
    if (hostname && hostname !== "unknown-host") {
      this.updateEntity(this.hosts, hostname, riskEvent, updates.hosts);
    }

    // 2. Evaluate User Risk
    const username = alert.data?.dstuser || alert.data?.srcuser || alert.syscheck?.audit?.user || null;
    if (username && username !== "root" && username !== "unknown") {
      this.updateEntity(this.users, username, riskEvent, updates.users);
    }

    // 3. Evaluate Source IP Risk
    const srcIp = alert.data?.srcip || alert.data?.src_ip || null;
    if (srcIp && srcIp !== "127.0.0.1" && srcIp !== "::1") {
      this.updateEntity(this.ips, srcIp, riskEvent, updates.ips);
    }

    return {
      alertId: alert.id,
      riskIncrement: Math.round(riskIncrement),
      updates
    };
  }

  updateEntity(store, key, riskEvent, updateList) {
    if (!store[key]) {
      store[key] = {
        name: key,
        riskScore: 0,
        events: [],
        lastUpdated: new Date().toISOString()
      };
    }

    const entity = store[key];
    // Add risk and cap at 100
    entity.riskScore = Math.min(entity.riskScore + riskEvent.increment, 100);
    
    // Add event to history (keep last 10 events for UI space efficiency)
    entity.events.unshift(riskEvent);
    if (entity.events.length > 10) entity.events.pop();
    
    entity.lastUpdated = new Date().toISOString();
    
    updateList.push({
      name: key,
      riskScore: Math.round(entity.riskScore),
      events: entity.events
    });
  }

  // Decay risk scores over time (Cybersecurity hygiene: older events matter less)
  decayRiskScores() {
    const decayAmount = 1; // Decay 1 point of risk every 10 seconds
    const stores = [this.hosts, this.users, this.ips];

    stores.forEach(store => {
      Object.keys(store).forEach(key => {
        const entity = store[key];
        if (entity.riskScore > 0) {
          entity.riskScore = Math.max(0, entity.riskScore - decayAmount);
        }
      });
    });
  }

  // Get current state for the Dashboard
  getRiskSummary() {
    const getTopEntities = (store) => {
      return Object.values(store)
        .map(e => ({
          name: e.name,
          riskScore: Math.round(e.riskScore),
          events: e.events,
          lastUpdated: e.lastUpdated
        }))
        .sort((a, b) => b.riskScore - a.riskScore);
    };

    return {
      hosts: getTopEntities(this.hosts),
      users: getTopEntities(this.users),
      ips: getTopEntities(this.ips)
    };
  }
}

module.exports = new RiskEngine();
