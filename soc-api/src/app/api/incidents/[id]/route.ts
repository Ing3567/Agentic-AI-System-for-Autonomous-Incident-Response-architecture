import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse, UpdateIncidentRequest } from '@/types/api';
import { Prisma } from '@prisma/client';

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
 * GET /api/incidents/[id]
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await context.params;
    const incident = await findIncident(id);

    if (!incident) {
      return NextResponse.json(
        { success: false, error: `Incident "${id}" not found`, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: incident,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve incident', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/incidents/[id]
 * n8n เรียกมาอัพเดทสถานะ
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await context.params;
    const incident = await findIncident(id);

    if (!incident) {
      return NextResponse.json(
        { success: false, error: `Incident "${id}" not found`, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body: UpdateIncidentRequest = await request.json();
    const { status, confidenceScore, duration, resolution, timeline, resumeUrl } = body;

    if (status && !['Pending', 'Success', 'Failed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'status must be Pending, Success, or Failed', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const now = new Date();
    const updateData: Prisma.IncidentUpdateInput = {};

    if (status) updateData.status = status;
    if (confidenceScore !== undefined) updateData.confidenceScore = confidenceScore;
    if (duration) updateData.duration = duration;

    if (resumeUrl) {
      updateData.resumeUrl = resumeUrl;
      updateData.approvalStatus = 'waiting';
    }

    if (timeline) {
      await prisma.timelineEvent.create({
        data: {
          incidentId: incident.id,
          step: incident.timeline.length + 1,
          title: timeline.title,
          time: now.toTimeString().slice(0, 8),
          description: timeline.description,
          type: timeline.type,
        },
      });
    }

    if (status === 'Success') {
      if (!duration) {
        const ms = now.getTime() - new Date(incident.timestamp).getTime();
        updateData.duration = `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
      }
      updateData.resolvedAt = now;

      if (resolution) {
        const stepCount = incident.timeline.length + (timeline ? 1 : 0) + 1;
        await prisma.timelineEvent.create({
          data: {
            incidentId: incident.id,
            step: stepCount,
            title: 'Resolution',
            time: now.toTimeString().slice(0, 8),
            description: resolution,
            type: 'resolution',
          },
        });
      }
    }

    const updated = await prisma.incident.update({
      where: { id: incident.id },
      data: updateData,
      include: { timeline: { orderBy: { step: 'asc' } } },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Incident ${incident.incidentNumber} updated`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('PATCH /api/incidents/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update incident', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/incidents/[id]
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await context.params;
    const incident = await findIncident(id);

    if (!incident) {
      return NextResponse.json(
        { success: false, error: `Incident "${id}" not found`, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    await prisma.incident.delete({ where: { id: incident.id } });

    return NextResponse.json({
      success: true,
      message: `Incident ${incident.incidentNumber} deleted`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete incident', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}