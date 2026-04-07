import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/generateId';
import { ApiResponse } from '@/types/api';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const type = new URL(request.url).searchParams.get('type') || 'incident';
    const result = await generateId(type);
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate ID', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}