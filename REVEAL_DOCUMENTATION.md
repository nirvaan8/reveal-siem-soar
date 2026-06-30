# REVEAL: Autonomous AI-Driven SIEM & SOAR Platform
### Technical Architecture & Deployment Documentation

---

## 1. Project Overview

**Reveal** is a high-fidelity, autonomous security operations ecosystem designed to bridge the gap between reactive detection (**SIEM**) and active incident containment (**SOAR**). Inspired by modern next-generation security platforms (such as *Gurucul Reveal*), the platform integrates:
*   **Real-time Log Aggregation**: Ingests security alerts from host-based intrusion detection engines (Wazuh).
*   **User & Entity Behavior Analytics (UEBA)**: Dynamically calculates rolling risk scores (0–100) for hosts, users, and threat IPs.
*   **AI-Powered Incident Triage**: Automatically summarizes telemetry and writes remediation playbooks using the Gemini API.
*   **Active SOAR Remediation**: Orchestrates multi-step containment workflows and executes secure SSH remote commands to quarantine threats on target systems.

---

## 2. Technical Architecture

```mermaid
graph TD
    subgraph Target Endpoint (Kali Linux VM)
        Wazuh[Wazuh Manager / logs] -->|Tails alerts.json| Fwd[Log Forwarder Script]
        Host[Firewall / Processes] <---|Executes SSH Commands| SSHd[SSH Daemon]
    end

    subgraph Host Machine (Mac SIEM/SOAR Node)
        Fwd -->|HTTP POST JSON| API[/api/alerts Webhook]
        API --> Logic[SOAR Engine & Risk Engine]
        
        Logic -->|Calculates Risk| UEBA[UEBA Risk Cache]
        Logic -->|Requests Analysis| AI[Gemini API Agent]
        Logic -->|Spawns Playbook| Playbook[Playbook Manager]
        
        Playbook -->|SSH Execution| SSHd
        
        Logic -->|Pushes State Updates| WS[WebSocket Server]
        
        subgraph Web Dashboard (React SPA)
            WS -->|Real-time streams| UI[Dashboard UI]
            UI -->|Trigger Approval / Run Playbook| API
        end
    end
```

### Component Breakdown:
*   **Frontend (React + Vite)**: A premium-grade, glassmorphic security dashboard. Styled with custom dark grid vectors, glowing neon thresholds (green/orange/red), and responsive visual tables.
*   **Backend (Node.js + WebSockets)**: Integrates an HTTP Express server for log ingestion and REST controls, a WebSocket server for pushing live telemetry, and an SSH connection library (`ssh2`) to orchestrate endpoint remediation.
*   **Forwarder Agent (Python 3)**: A lightweight daemon running on the endpoint (Kali VM) that tails Wazuh alerts (`alerts.json`) and forwards events to the SIEM webhook.

---

## 3. Operational Data Flows

### A. Ingestion & Analytics Pipeline
1.  A security event occurs on the endpoint (e.g., failed login, file modified).
2.  Wazuh registers the event, maps it to a signature, and writes it to `/var/ossec/logs/alerts/alerts.json`.
3.  The **Log Forwarder** reads the JSON line, queues it, and POSTs it to `http://<host-ip>:5001/api/alerts`.
4.  The Backend Server ingests the payload:
    *   **Risk Evaluation**: Maps the Wazuh rule level (0-15) to risk points. Increases cumulative risk scores for the associated Host, User, and Source IP, capping at 100.
    *   **AI Triage**: Sends the alert metadata to Gemini to write an executive summary and recommended mitigation playbook.
    *   **Playbook Spawning**: If the rule level is $\ge 8$, the SOAR engine automatically initiates a containment playbook.

### B. SOAR Playbook Lifecycle
The playbooks are executed in sequential, non-blocking steps:

```
[Extract Telemetry] ➔ [Threat Intel Enrichment] ➔ [Awaiting Operator Approval] ➔ [SSH Execution] ➔ [Resolution Audit]
```

1.  **Extract**: Grabs key data (IP, PID, File Path).
2.  **Enrich**: Queries threat intelligence sources (AbuseIPDB/VirusTotal) to assess threat confidence.
3.  **Approve**: Playbook pauses at Step 3 to prevent accidental service disruption. It pulses in the Dashboard's Triage center, requesting the analyst's approval.
4.  **Execute**: Once the analyst clicks **Approve**, the server establishes an SSH channel to the target machine and executes the active block.
5.  **Audit**: Runs confirmation checks and logs the results to the playbook history.

---

## 4. SSH Remediation Playbooks (Kali VM Commands)

The platform supports three core remediation workflows. Below are the actual commands executed on the target Kali VM:

### 1. Ingress Network Block (`block-ip`)
Used to mitigate brute-force attempts or active network attacks.
*   **Remediation Command**:
    ```bash
    sudo iptables -A INPUT -s <BLOCKED_IP> -j DROP
    ```
*   **How it works**: Adds a rule to the top of the Linux firewall table (`iptables`) blocking all incoming network packets from the malicious source IP address.

### 2. Rogue Process Termination (`kill-process`)
Used to stop malware executables, backdoors, or cryptominers.
*   **Remediation Command**:
    ```bash
    sudo kill -9 <TARGET_PID>
    ```
*   **How it works**: Sends a `SIGKILL` (signal 9) directly to the target Process ID, forcing the Linux kernel to terminate the execution immediately.

### 3. File System Containment (`quarantine-file`)
Used to isolate dropped scripts, web shells, or ransomware payloads.
*   **Remediation Command**:
    ```bash
    sudo mkdir -p /tmp/quarantine && sudo mv <FILE_PATH> /tmp/quarantine/quarantined_<TIMESTAMP> && sudo chmod 000 /tmp/quarantine/quarantined_<TIMESTAMP>
    ```
*   **How it works**: Moves the target file out of its execution directory to `/tmp/quarantine/`, renames it with a timestamp, and strips all read, write, and execute permissions (`chmod 000`) to render it inert.

---

## 5. Deployment Step-by-Step Guide

### Step 1: Configure Kali Linux SSH
For the SOAR dashboard to run remediations on your Kali VM, you must enable SSH daemon access:

1.  Open terminal on **Kali VM** and install OpenSSH server:
    ```bash
    sudo apt update && sudo apt install -y openssh-server
    ```
2.  Enable and start the SSH service:
    ```bash
    sudo systemctl enable --now ssh
    ```
3.  Get the VM's IP address:
    ```bash
    ip a | grep inet
    ```
    *(Note down the IP address, e.g., `192.168.121.20`)*

### Step 2: Configure SIEM/SOAR Backend `.env`
On your **Host Mac**, configure the project parameters:

1.  Navigate to the backend folder:
    `/Users/nirvaankatyal/soc-soar-platform/backend`
2.  Open the `.env` file:
    [backend/.env](file:///Users/nirvaankatyal/soc-soar-platform/backend/.env)
3.  Configure your credentials:
    ```env
    PORT=5001
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE  # Provide key for real AI analysis

    # SSH VM Targets
    KALI_SSH_HOST=192.168.x.x  # Enter your Kali IP
    KALI_SSH_PORT=22
    KALI_SSH_USER=kali         # Enter your Kali username
    KALI_SSH_PASSWORD=kali     # Enter your Kali password
    ```

### Step 3: Run the Platform locally on Mac
1.  **Terminal 1 (Backend)**:
    ```bash
    cd /Users/nirvaankatyal/soc-soar-platform/backend
    npm start
    ```
    *Log output should confirm: `🚀 Gurucul SIEM/SOAR Backend active on port 5001`*
2.  **Terminal 2 (Frontend Dashboard)**:
    ```bash
    cd /Users/nirvaankatyal/soc-soar-platform/frontend
    npm run dev
    ```
    *Open the local link in your browser (`http://localhost:5173`).*

### Step 4: Install Wazuh on Kali (Optional - For Real Alerts)
1.  Inside your **Kali VM**, install Wazuh single-host manager:
    ```bash
    curl -sO https://packages.wazuh.com/4.x/wazuh-install.sh
    sudo bash wazuh-install.sh -a
    ```
2.  Once installed, run the log forwarder script on your Kali VM to point back to your Mac:
    ```bash
    python3 forwarder.py --url http://<host-mac-ip>:5001/api/alerts --file /var/ossec/logs/alerts/alerts.json
    ```
    *(Replace `<host-mac-ip>` with your Mac's local network IP).*

---

## 6. How to Export this Guide
To convert this guide to a **PDF** or **Word Document** for submission:
1.  Open the workspace folder in **VS Code**.
2.  Install the **Markdown PDF** extension.
3.  Right-click anywhere in this file (`REVEAL_DOCUMENTATION.md`) and select **"Markdown PDF: Export (pdf)"**.
4.  Alternatively, import the raw text of this file into **Google Docs** or **Microsoft Word** and format it to your liking.
