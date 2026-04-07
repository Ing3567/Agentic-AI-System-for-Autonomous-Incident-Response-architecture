import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateId } from '@/lib/generateId';
import { ApiResponse, CreateIncidentRequest } from '@/types/api';
import { Prisma } from '@prisma/client';

/**
 * GET /api/incidents
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const severity = url.searchParams.get('severity');
    const approval = url.searchParams.get('approval');
    const search = url.searchParams.get('search');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
    const sortBy = url.searchParams.get('sortBy') || 'timestamp';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: Prisma.IncidentWhereInput = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (search) {
      where.OR = [
        { incidentNumber: { contains: search } },
        { threatType: { contains: search } },
        { sourceIP: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Filter approval
    switch (approval) {
      case 'waiting':
        where.approvalStatus = 'waiting';
        where.resumeUrl = { not: null };
        break;
      case 'approved':
        where.approvalStatus = 'approved';
        break;
      case 'rejected':
        where.approvalStatus = 'rejected';
        break;
      case 'none':
        // Incidents ที่ไม่มี approval flow
        where.approvalStatus = null;
        break;
    }

    const orderBy: Record<string, string> = {};
    const allowed = ['timestamp', 'severity', 'status', 'createdAt'];
    orderBy[allowed.includes(sortBy) ? sortBy : 'timestamp'] = sortOrder;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: { timeline: { orderBy: { step: 'asc' } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.incident.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: incidents,
      timestamp: new Date().toISOString(),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET /api/incidents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve incidents', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

/**
 * POST /api/incidents
 *
 * กรณีที่ 1 - n8n ส่ง resumeUrl:
 * {
 *   "threatType": "SSH Brute Force",
 *   "severity": "High",
 *   "sourceIP": "192.168.1.105",
 *   "resumeUrl": "http://n8n:5678/webhook-waiting/abc-123"
 * }
 * → approvalStatus = "waiting"
 *
 * กรณีที่ 2 - n8n ไม่ส่ง resumeUrl (หรือเรียกจากที่อื่น):
 * {
 *   "threatType": "Port Scanning",
 *   "severity": "Low",
 *   "sourceIP": "45.33.32.156"
 * }
 * → approvalStatus = null (ไม่ต้อง approve)
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body: CreateIncidentRequest = await request.json();
    const { threatType, severity, sourceIP, description, confidenceScore, resumeUrl } = body;

    if (!threatType || !severity || !sourceIP) {
      return NextResponse.json(
        { success: false, error: 'Missing: threatType, severity, sourceIP', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (!['High', 'Medium', 'Low'].includes(severity)) {
      return NextResponse.json(
        { success: false, error: 'severity must be High, Medium, or Low', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const { id: incidentNumber } = await generateId('incident');
    const now = new Date();

    // ถ้ามี resumeUrl → ต้อง approve, ถ้าไม่มี → null
    const hasResumeUrl = !!resumeUrl;

    const incident = await prisma.incident.create({
      data: {
        incidentNumber,
        timestamp: now,
        threatType,
        severity,
        status: 'Pending',
        sourceIP,
        description: description || null,
        confidenceScore: confidenceScore || 0,
        resumeUrl: resumeUrl || null,
        approvalStatus: hasResumeUrl ? 'waiting' : null,
        timeline: {
          create: {
            step: 1,
            title: 'Threat Detected',
            time: now.toTimeString().slice(0, 8),
            description: description || `${threatType} detected from ${sourceIP}`,
            type: 'detection',
          },
        },
      },
      include: { timeline: { orderBy: { step: 'asc' } } },
    });

    const message = hasResumeUrl
      ? `Incident ${incidentNumber} created — waiting for analyst approval`
      : `Incident ${incidentNumber} created`;

    return NextResponse.json(
      { success: true, data: incident, message, timestamp: new Date().toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/incidents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create incident', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}