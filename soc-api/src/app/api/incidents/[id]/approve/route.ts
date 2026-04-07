import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse, ApproveRequest } from '@/types/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function findIncident(idOrNumber: string) {
  return (
    (await prisma.incident.findUnique({
      where: { id: idOrNumber },
      include: { timeline: { orderBy: { step: 'asc' } } },
    })) ||
    (await prisma.incident.findUnique({
      where: { incidentNumber: idOrNumber },
      include: { timeline: { orderBy: { step: 'asc' } } },
    }))
  );
}

/**
 * POST /api/incidents/[id]/approve
 *
 * เรียกได้เฉพาะ incident ที่มี resumeUrl และ approvalStatus = "waiting"
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await context.params;
    const incident = await findIncident(id);

    // === Validation ===

    if (!incident) {
      return NextResponse.json(
        { success: false, error: `Incident "${id}" not found`, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    // ตรวจสอบว่า incident นี้มี approval flow ไหม
    if (incident.approvalStatus === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'This incident does not require approval',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ายังรออยู่ไหม
    if (incident.approvalStatus !== 'waiting') {
      return NextResponse.json(
        {
          success: false,
          error: `Incident already ${incident.approvalStatus}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี resumeUrl ไหม
    if (!incident.resumeUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'No resume URL — cannot notify n8n',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // === Parse Body ===

    const body: ApproveRequest = await request.json();
    const { action, approvedBy, reason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be "approve" or "reject"', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const now = new Date();
    const isApproved = action === 'approve';
    const actor = approvedBy || 'SOC Analyst';

    // === 1. ยิง resumeUrl กลับไป n8n ===

    try {
      const n8nRes = await fetch(incident.resumeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: isApproved,
          action,
          incidentId: incident.id,
          incidentNumber: incident.incidentNumber,
          approvedBy: actor,
          reason: reason || (isApproved ? 'Approved by analyst' : 'Rejected by analyst'),
          approvedAt: now.toISOString(),
          incident: {
            threatType: incident.threatType,
            severity: incident.severity,
            sourceIP: incident.sourceIP,
            confidenceScore: incident.confidenceScore,
          },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!n8nRes.ok) {
        const errBody = await n8nRes.text();
        console.error(`n8n ${n8nRes.status}: ${errBody}`);
        return NextResponse.json(
          {
            success: false,
            error: `n8n responded with ${n8nRes.status}`,
            data: { n8nStatus: n8nRes.status, n8nBody: errBody },
            timestamp: new Date().toISOString(),
          },
          { status: 502 }
        );
      }
    } catch (fetchErr) {
      const errMsg = fetchErr instanceof Error ? fetchErr.message : 'Unknown error';
      console.error('Failed to reach n8n:', errMsg);
      return NextResponse.json(
        {
          success: false,
          error: `Cannot reach n8n: ${errMsg}`,
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

    // === 2. อัพเดท DB ===

    // Add approval timeline event
    await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        step: incident.timeline.length + 1,
        title: isApproved ? 'Approved by Analyst' : 'Rejected by Analyst',
        time: now.toTimeString().slice(0, 8),
        description: `${isApproved ? '✅ Approved' : '❌ Rejected'} by ${actor}${reason ? `: ${reason}` : ''}`,
        type: 'approval',
      },
    });

    const updated = await prisma.incident.update({
      where: { id: incident.id },
      data: {
        approvalStatus: isApproved ? 'approved' : 'rejected',
        approvedAt: now,
        approvedBy: actor,
        // ถ้า reject → Failed, ถ้า approve → ยังคง Pending (รอ n8n อัพเดทเป็น Success)
        status: isApproved ? 'Pending' : 'Failed',
        resumeUrl: null,  // ล้าง URL หลังใช้แล้ว
      },
      include: { timeline: { orderBy: { step: 'asc' } } },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Incident ${incident.incidentNumber} ${isApproved ? 'approved' : 'rejected'} → n8n resumed`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('POST approve:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}