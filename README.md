# 🛡️ Agentic AI System for Autonomous Incident Response

An automated Security Operations Center (SOC) ecosystem powered by Agentic AI. This project integrates SIEM, SOAR, and RAG technologies to autonomously detect, analyze, and remediate cybersecurity threats based on Standard Operating Procedures (SOPs), significantly reducing analyst alert fatigue.

## 🏗️ System Architecture

The system is built on a decoupled, closed-loop architecture consisting of four main logical layers:

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **1. SIEM (Sensors & Actuators)** | Wazuh (v4.9.0) | Detects endpoint anomalies and executes remediation scripts (Active Response) via Agent processes. |
| **2. Orchestration (SOAR)** | n8n | The "Brain" managing multi-agent workflows. Handles asynchronous event-driven logic between detection and response. |
| **3. Knowledge Base (RAG)** | AnythingLLM | Vector database storing SOC Playbooks and SOPs to provide context to the AI and prevent hallucination. |
| **4. Web Dashboard** | Next.js, Prisma | A centralized web interface for incident tracking, timeline visualization, and manual oversight. |

## ✨ Key Features

* **Context-Aware Triage:** AI agents utilize Retrieval-Augmented Generation (RAG) to query historical incident data and predefined SOPs before making decisions.
* **Autonomous Remediation:** Executes Zero-Touch remediation (e.g., moving malicious files to quarantine) using Wazuh's REST API and Direct Execution Bypass (`!quarantine-file.sh`).
* **Multi-Agent Collaboration:** Divides tasks logically—Agent 1 focuses on threat analysis and documentation, while Agent 2 determines and executes the remediation strategy.
* **Centralized Incident Management:** All AI actions, alert metadata, and endpoint status are synced to a relational database for dashboard visualization.

## 📂 Repository Structure (Monorepo)

This project adopts a Monorepo approach to maintain separation of concerns while keeping the ecosystem unified:

```text
.
├── .gitignore                 # Security baseline (ignores .env, node_modules, etc.)
├── README.md
├── soc-api/                   # Frontend & Backend (Next.js + Prisma)
├── Project_agebtic/           # Orchestration workflows & RAG (n8n + AnythingLLM)
└── Wazuh/                     # SIEM Configuration & Compose files
```
🚀 Getting Started
Prerequisites
Docker & Docker Compose

Node.js (v18+)

Ubuntu/Linux Endpoint (configured as Wazuh Agent)

Installation & Setup
1. Clone the repository

Bash
```
git clone [https://github.com/](https://github.com/)<YOUR-USERNAME>/<REPO-NAME>.git
cd <REPO-NAME>
2. Environment Configuration (Crucial)
Never hardcode passwords. Create a .env file in the /Wazuh directory and define your credentials:
```
```
ข้อมูลโค้ด
INDEXER_PASSWORD=your_secure_password
API_PASSWORD=your_secure_api_password
(Ensure .env is listed in your .gitignore)
```
3. Deploy Services
Start each layer independently from their respective directories:
```
Bash
# Start SIEM Layer
cd Wazuh
docker compose up -d
```
```
# Start Orchestration Layer
cd ../Project_agebtic
docker compose up -d
4. Start the Web Dashboard
```
```
Bash
cd ../soc-api
npm install
npx prisma generate
npm run dev
```