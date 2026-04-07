import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...\n');

  await prisma.idSequence.upsert({
    where: { prefix: 'INC' },
    update: { current: 7 },
    create: { prefix: 'INC', current: 7 },
  });

  const data = [
    // ===== กรณีที่ 1: ไม่มี approval flow (n8n ไม่ส่ง resumeUrl) =====
    {
      incidentNumber: 'INC-20240115-0001',
      timestamp: new Date('2024-01-15T14:32:05'),
      threatType: 'SSH Brute Force',
      severity: 'High',
      status: 'Success',
      sourceIP: '192.168.1.105',
      duration: '2m 34s',
      confidenceScore: 98.5,
      description: 'Multiple failed SSH login attempts',
      approvalStatus: null,  // ← ไม่มี approval
      resolvedAt: new Date('2024-01-15T14:34:39'),
      timeline: [
        { step: 1, title: 'Threat Detected', time: '14:32:05', description: '47 failed SSH attempts in 30s', type: 'detection' },
        { step: 2, title: 'AI Analysis', time: '14:32:08', description: 'SSH brute force confirmed. Risk: Critical.', type: 'analysis' },
        { step: 3, title: 'Auto Blocked', time: '14:32:12', description: 'IP blocked at firewall (auto)', type: 'action' },
        { step: 4, title: 'Resolution', time: '14:34:39', description: 'Threat neutralized. No breach.', type: 'resolution' },
      ],
    },
    {
      incidentNumber: 'INC-20240115-0002',
      timestamp: new Date('2024-01-15T07:42:51'),
      threatType: 'Port Scanning',
      severity: 'Low',
      status: 'Success',
      sourceIP: '45.33.32.156',
      duration: '0m 45s',
      confidenceScore: 91.7,
      description: 'External port scanning',
      approvalStatus: null,  // ← ไม่มี approval
      resolvedAt: new Date('2024-01-15T07:43:36'),
      timeline: [
        { step: 1, title: 'Threat Detected', time: '07:42:51', description: 'Port scanning from external IP.', type: 'detection' },
        { step: 2, title: 'Auto Blocked', time: '07:42:58', description: 'IP blocked automatically (low risk).', type: 'action' },
        { step: 3, title: 'Resolution', time: '07:43:36', description: 'Scanning stopped.', type: 'resolution' },
      ],
    },

    // ===== กรณีที่ 2: มี approval flow - กำลังรอ =====
    {
      incidentNumber: 'INC-20240115-0003',
      timestamp: new Date('2024-01-15T13:45:22'),
      threatType: 'Malware Detection',
      severity: 'High',
      status: 'Pending',
      sourceIP: '10.0.0.45',
      confidenceScore: 87.2,
      description: 'Suspicious executable on endpoint WS-045',
      resumeUrl: 'http://localhost:5678/webhook-waiting/test-malware-123',
      approvalStatus: 'waiting',  // ← รอ approve
      timeline: [
        { step: 1, title: 'Threat Detected', time: '13:45:22', description: 'Suspicious executable on WS-045.', type: 'detection' },
        { step: 2, title: 'AI Analysis', time: '13:45:25', description: 'Hash matches known malware. Waiting for approval.', type: 'analysis' },
      ],
    },
    {
      incidentNumber: 'INC-20240115-0004',
      timestamp: new Date('2024-01-15T12:18:44'),
      threatType: 'Phishing Attempt',
      severity: 'Medium',
      status: 'Pending',
      sourceIP: '203.45.67.89',
      confidenceScore: 94.8,
      description: 'Phishing email with malicious attachment',
      resumeUrl: 'http://localhost:5678/webhook-waiting/test-phish-456',
      approvalStatus: 'waiting',  // ← รอ approve
      timeline: [
        { step: 1, title: 'Threat Detected', time: '12:18:44', description: 'Suspicious email quarantined.', type: 'detection' },
        { step: 2, title: 'AI Analysis', time: '12:18:47', description: 'Known phishing domain detected.', type: 'analysis' },
      ],
    },
    {
      incidentNumber: 'INC-20240115-0005',
      timestamp: new Date('2024-01-15T08:15:09'),
      threatType: 'Data Exfiltration',
      severity: 'Low',
      status: 'Pending',
      sourceIP: '192.168.5.201',
      confidenceScore: 65.4,
      description: 'Unusual outbound data transfer',
      resumeUrl: 'http://localhost:5678/webhook-waiting/test-exfil-789',
      approvalStatus: 'waiting',  // ← รอ approve
      timeline: [
        { step: 1, title: 'Threat Detected', time: '08:15:09', description: 'Unusual outbound transfer.', type: 'detection' },
      ],
    },

    // ===== กรณีที่ 3: มี approval flow - approved แล้ว =====
    {
      incidentNumber: 'INC-20240115-0006',
      timestamp: new Date('2024-01-15T09:22:17'),
      threatType: 'Unauthorized Access',
      severity: 'Medium',
      status: 'Success',
      sourceIP: '172.16.0.88',
      duration: '1m 08s',
      confidenceScore: 99.1,
      description: 'Compromised credentials detected',
      approvalStatus: 'approved',  // ← approve แล้ว
      approvedBy: 'SOC Analyst',
      approvedAt: new Date('2024-01-15T09:22:25'),
      resolvedAt: new Date('2024-01-15T09:23:25'),
      timeline: [
        { step: 1, title: 'Threat Detected', time: '09:22:17', description: 'Unusual login outside hours.', type: 'detection' },
        { step: 2, title: 'AI Analysis', time: '09:22:19', description: 'Compromised credentials detected.', type: 'analysis' },
        { step: 3, title: 'Approved by Analyst', time: '09:22:25', description: '✅ Approved by SOC Analyst', type: 'approval' },
        { step: 4, title: 'Playbook Executed', time: '09:22:30', description: 'Session terminated. Account locked.', type: 'action' },
        { step: 5, title: 'Resolution', time: '09:23:25', description: 'Account secured.', type: 'resolution' },
      ],
    },

    // ===== กรณีที่ 4: มี approval flow - rejected =====
    {
      incidentNumber: 'INC-20240115-0007',
      timestamp: new Date('2024-01-15T11:05:33'),
      threatType: 'DDoS Attack',
      severity: 'High',
      status: 'Failed',
      sourceIP: '45.33.32.0/24',
      duration: '15m 42s',
      confidenceScore: 76.3,
      description: 'DDoS on web servers',
      approvalStatus: 'rejected',  // ← rejected
      approvedBy: 'SOC Lead',
      approvedAt: new Date('2024-01-15T11:06:00'),
      timeline: [
        { step: 1, title: 'Threat Detected', time: '11:05:33', description: 'Traffic spike 50x normal.', type: 'detection' },
        { step: 2, title: 'AI Analysis', time: '11:05:40', description: 'DDoS pattern detected.', type: 'analysis' },
        { step: 3, title: 'Rejected by Analyst', time: '11:06:00', description: '❌ Rejected: False positive - planned load test', type: 'approval' },
      ],
    },
  ];

  for (const item of data) {
    const { timeline, ...rest } = item;
    await prisma.incident.create({
      data: { ...rest, timeline: { create: timeline } },
    });

    const approvalLabel =
      rest.approvalStatus === null ? '(no approval)' :
      rest.approvalStatus === 'waiting' ? '⏳ waiting' :
      rest.approvalStatus === 'approved' ? '✅ approved' :
      '❌ rejected';

    console.log(`  ✅ ${rest.incidentNumber}  ${approvalLabel}`);
  }

  const waiting = data.filter((d) => d.approvalStatus === 'waiting').length;
  const noApproval = data.filter((d) => d.approvalStatus === null).length;

  console.log(`
🎉 Done!
   ${data.length} incidents
   ${noApproval} without approval flow
   ${waiting} waiting for approval
   ${data.filter((d) => d.approvalStatus === 'approved').length} approved
   ${data.filter((d) => d.approvalStatus === 'rejected').length} rejected`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });