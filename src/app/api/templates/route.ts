import { NextResponse } from 'next/server';
import { listTemplates } from '@/lib/meta/whatsapp';

export async function GET() {
  try {
    const response = await listTemplates({ limit: 100 });

    return NextResponse.json({
      data: response.data,
      paging: response.paging
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
