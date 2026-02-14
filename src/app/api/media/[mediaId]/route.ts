import { NextResponse } from 'next/server';
import { downloadMediaByUrl, getMedia } from '@/lib/meta/whatsapp';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params;
  try {
    const metadata = await getMedia({ mediaId });
    if (!metadata.url) {
      return NextResponse.json(
        { error: 'Media URL not available', mediaId },
        { status: 404 }
      );
    }

    const buffer = await downloadMediaByUrl({ url: metadata.url });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': metadata.mime_type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch media',
        details: error instanceof Error ? error.message : 'Unknown error',
        mediaId
      },
      { status: 500 }
    );
  }
}
