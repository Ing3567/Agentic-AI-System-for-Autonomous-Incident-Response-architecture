import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const [total, pending, needsApproval] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: 'Pending' } }),
      prisma.incident.count({
        where: { approvalStatus: 'waiting', resumeUrl: { not: null } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { status: 'healthy', database: 'connected', total, pending, needsApproval },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Health check failed', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}