import { NextResponse } from 'next/server';
import { sendAudio, sendDocument, sendImage, sendText, sendVideo, uploadMedia } from '@/lib/meta/whatsapp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const to = formData.get('to') as string;
    const body = formData.get('body') as string;
    const file = formData.get('file') as File | null;

    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to' },
        { status: 400 }
      );
    }

    let result;
    let local: { uploadedMediaId: string; mediaType: string; filename: string; mimeType: string } | undefined;

    // Send media message
    if (file) {
      const fileType = file.type.split('/')[0]; // image, video, audio, application
      const mediaType: 'image' | 'video' | 'audio' | 'document' =
        fileType === 'image' || fileType === 'video' || fileType === 'audio' ? fileType : 'document';

      // Upload media first
      const uploadResult = await uploadMedia({
        type: mediaType,
        file,
        fileName: file.name
      });
      local = {
        uploadedMediaId: uploadResult.id,
        mediaType,
        filename: file.name,
        mimeType: file.type
      };

      // Send message with media
      if (mediaType === 'image') {
        result = await sendImage({
          to,
          image: { id: uploadResult.id, caption: body || undefined }
        });
      } else if (mediaType === 'video') {
        result = await sendVideo({
          to,
          video: { id: uploadResult.id, caption: body || undefined }
        });
      } else if (mediaType === 'audio') {
        result = await sendAudio({
          to,
          audio: { id: uploadResult.id }
        });
      } else {
        result = await sendDocument({
          to,
          document: { id: uploadResult.id, caption: body || undefined, filename: file.name }
        });
      }
    } else if (body) {
      // Send text message
      result = await sendText({
        to,
        body
      });
    } else {
      return NextResponse.json(
        { error: 'Either body or file is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...result,
      ...(local ? { _local: local } : {})
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
