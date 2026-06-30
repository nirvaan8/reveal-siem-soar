#!/usr/bin/env python3
# forwarder.py
# Run this script on your Kali Linux VM to parse auth logs and forward SSH alerts to your SIEM/SOAR Dashboard.
# Bypasses the need for Wazuh Manager on ARM64 VMs.

import os
import sys
import time
import json
import re
import argparse
import requests

def parse_args():
    parser = argparse.ArgumentParser(description="Native Kali Log Forwarder Agent")
    parser.add_argument(
        "--url", 
        default="http://192.168.64.1:5001/api/alerts", 
        help="URL of the custom SIEM/SOAR dashboard webhook endpoint"
    )
    parser.add_argument(
        "--file", 
        default="/var/log/auth.log", 
        help="Absolute path to OS auth log file (usually /var/log/auth.log)"
    )
    return parser.parse_args()

def tail_file(filepath):
    try:
        f = open(filepath, "r", encoding="utf-8", errors="ignore")
    except FileNotFoundError:
        # Fallback for systems using systemd-journald instead of rsyslog
        print(f"[-] Error: File not found at '{filepath}'.")
        print("[*] Troubleshooting: Make sure rsyslog is installed: 'sudo apt install rsyslog'")
        sys.exit(1)
    except PermissionError:
        print(f"[-] Permission Denied. Try running with sudo: 'sudo python3 forwarder.py'")
        sys.exit(1)

    print(f"[+] Successfully opened auth log stream: {filepath}")
    f.seek(0, os.SEEK_END)
    
    while True:
        line = f.readline()
        if not line:
            time.sleep(0.1)
            continue
        yield line

def parse_auth_line(line):
    """
    Parses SSH login failure lines from /var/log/auth.log.
    Example line: Jun 26 10:52:12 kali sshd[1234]: Failed password for invalid user admin from 192.168.64.1 port 54321 ssh2
    """
    # Regex to capture SSH login failures
    fail_pattern = re.compile(r"sshd\[\d+\]: Failed password for (?:invalid user )?(\S+) from (\S+) port (\d+)")
    match = fail_pattern.search(line)
    
    if match:
        user = match.group(1)
        ip = match.group(2)
        port = match.group(3)
        
        # Build Wazuh-compatible JSON structure
        alert = {
            "id": f"auth-{int(time.time() * 1000)}",
            "timestamp": new_timestamp(),
            "agent": {
                "id": "001",
                "name": "Kali-VM",
                "ip": "192.168.64.3"
            },
            "manager": {
                "name": "SIEM-HQ"
            },
            "rule": {
                "id": "5712",
                "level": 10,
                "description": f"sshd: Authentication failure parsed from auth.log - target user: {user}",
                "groups": ["sshd", "invalid_login", "authentication_failed"]
            },
            "data": {
                "srcip": ip,
                "srcport": port,
                "dstuser": user,
                "app": "sshd"
            }
        }
        return alert
    return None

def new_timestamp():
    return time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime())

def forward_logs(webhook_url, filepath):
    print("=========================================================")
    print("🚀 Native OS Auth Log Forwarder Agent Active")
    print(f"🛰️  Targeting SIEM Webhook: {webhook_url}")
    print(f"📄 Monitoring Log Source: {filepath}")
    print("=========================================================")

    failed_queue = []

    for new_line in tail_file(filepath):
        alert_payload = parse_auth_line(new_line)
        if not alert_payload:
            continue

        print(f"[!] Security Event Captured: SSH failure for user '{alert_payload['data']['dstuser']}' from {alert_payload['data']['srcip']}")

        try:
            headers = {"Content-Type": "application/json"}
            
            # Flush failed queue
            while failed_queue:
                old_payload = failed_queue[0]
                print(f"[*] Flushing queued log ({len(failed_queue)} remaining)...")
                retry_res = requests.post(webhook_url, json=old_payload, headers=headers, timeout=5)
                if retry_res.status_code == 200:
                    failed_queue.pop(0)
                else:
                    break

            res = requests.post(webhook_url, json=alert_payload, headers=headers, timeout=5)
            if res.status_code == 200:
                print(f"[+] Alert forwarded successfully: {alert_payload['rule']['description']}")
            else:
                print(f"[-] Dashboard returned status code {res.status_code}. Queueing payload.")
                failed_queue.append(alert_payload)

        except requests.exceptions.RequestException as err:
            print(f"[-] Connection Error to SIEM: {err}. Queueing payload.")
            failed_queue.append(alert_payload)
            time.sleep(2)

if __name__ == "__main__":
    args = parse_args()
    try:
        forward_logs(args.url, args.file)
    except KeyboardInterrupt:
        print("\n[+] Log forwarder stopped by operator. Exiting.")
        sys.exit(0)
