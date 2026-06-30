# Wazuh & SSH Setup Guide for Kali Linux VM

This document explains how to set up the **Wazuh Manager** on your Kali Linux VM (running on UTM), configure SSH access, and launch the alert forwarder script to connect it to your custom SIEM/SOAR Dashboard.

---

## Step 1: Install Wazuh on Kali Linux

Wazuh provides a single-command installer script that installs the Wazuh Indexer, Manager, and Dashboard on a single machine.

1.  Open a terminal inside your **Kali Linux VM**.
2.  Download and run the official Wazuh installation script:
    ```bash
    curl -sO https://packages.wazuh.com/4.x/wazuh-install.sh
    sudo bash wazuh-install.sh -a
    ```
    *(Note: This might take 5-10 minutes to pull and configure packages. Once finished, it will output the default admin passwords).*
3.  Verify that the Wazuh Manager service is running:
    ```bash
    sudo systemctl status wazuh-manager
    ```

---

## Step 2: Enable SSH on Kali Linux (For SOAR Remediations)

To allow your SOAR dashboard to execute firewall bans (`iptables`) or process terminations (`kill`), you must enable SSH access on the Kali VM.

1.  Install the OpenSSH Server (usually pre-installed on Kali):
    ```bash
    sudo apt update && sudo apt install -y openssh-server
    ```
2.  Enable and start the SSH service:
    ```bash
    sudo systemctl enable --now ssh
    ```
3.  Verify SSH is active:
    ```bash
    sudo systemctl status ssh
    ```
4.  Get your Kali VM's local IP address:
    ```bash
    ip a | grep inet
    ```
    *(Look for the IP address in your interface block, e.g., `192.168.121.20` or similar).*
5.  Test connection from your **Host Mac terminal**:
    ```bash
    ssh username@<kali-ip>
    ```

---

## Step 3: Configure the SIEM/SOAR Backend `.env`

Update your dashboard's backend environment file to connect to your Kali VM.

1.  Open the backend `.env` file on your Host Mac:
    [backend/.env](file:///Users/nirvaankatyal/soc-soar-platform/backend/.env)
2.  Enter your SSH credentials:
    ```env
    KALI_SSH_HOST=192.168.x.x  # Enter your Kali VM IP
    KALI_SSH_PORT=22
    KALI_SSH_USER=username     # Enter your Kali Username (e.g., kali)
    KALI_SSH_PASSWORD=password # Enter your Kali Password
    ```
3.  Restart the backend server. The console should print:
    `[SSH] Configuration found. Targeted host: 192.168.x.x`

---

## Step 4: Run the Log Forwarder Agent

The forwarder tails the Wazuh manager's raw JSON alert logs and feeds them into the SIEM dashboard.

1.  Copy the [forwarder.py](file:///Users/nirvaankatyal/soc-soar-platform/kali-agent/forwarder.py) script from your Mac workspace onto your Kali Linux VM.
2.  On the Kali VM, install python requirements (the script uses the standard `requests` library):
    ```bash
    pip3 install requests
    ```
3.  Run the forwarder script using `sudo` (since Wazuh logs are protected):
    ```bash
    sudo python3 forwarder.py --url http://<host-mac-ip>:5001/api/alerts --file /var/ossec/logs/alerts/alerts.json
    ```
    *(Replace `<host-mac-ip>` with your Mac's physical local network IP address, e.g., `192.168.1.15`).*

---

## Step 5: Test the Integration!

Perform an action on Kali that triggers a Wazuh rule (e.g., triggering a series of authentication failures):

1.  Simulate a failed login:
    ```bash
    ssh invaliduser@localhost
    ```
    *(Run this 8-10 times rapidly to trigger a brute force rule).*
2.  Check the forwarder terminal. It should print:
    `[+] Alert forwarded successfully: sshd: brute force attack...`
3.  Look at your web dashboard:
    *   The alert will pop up in the **Triage Center**.
    *   The risk score for `Kali-VM` and the source IP `127.0.0.1` will rise.
    *   The SOAR engine will spawn a playbook. Click **Approve Remediation** and verify that the firewall rule blocks the target IP!
