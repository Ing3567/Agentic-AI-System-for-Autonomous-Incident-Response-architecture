import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';

interface RouteContext {
  params: Promise<{ incidentId: string }>;
}

async function findIncident(idOrNumber: string) {
  return (
    (await prisma.incident.findUnique({ where: { id: idOrNumber } })) ||
    (await prisma.incident.findUnique({ where: { incidentNumber: idOrNumber } }))
  );
}

export async function GET(_req: NextRequest, ctx: RouteContext): Promise<NextResponse<ApiResponse>> {
  try {
    const { incidentId } = await ctx.params;
    const incident = await findIncident(incidentId);
    if (!incident) {
      return NextResponse.json(
        { success: false, error: `Incident "${incidentId}" not found`, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const events = await prisma.timelineEvent.findMany({
      where: { incidentId: incident.id },
      orderBy: { step: 'asc' },
    });

    return NextResponse.json({ success: true, data: events, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve timeline', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, ctx: RouteContext): Promise<NextResponse<ApiResponse>> {
  try {
    const { incidentId } = await ctx.params;
    const incident = await findIncident(incidentId);
    if (!incident) {
      return NextResponse.json(
        { success: false, error: `Incident "${incidentId}" not found`, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const { title, description, type } = await req.json();
    if (!title || !description || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing: title, description, type', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const count = await prisma.timelineEvent.count({ where: { incidentId: incident.id } });

    const event = await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        step: count + 1,
        title,
        time: new Date().toTimeString().slice(0, 8),
        description,
        type,
      },
    });

    return NextResponse.json(
      { success: true, data: event, timestamp: new Date().toISOString() },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to add event', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}