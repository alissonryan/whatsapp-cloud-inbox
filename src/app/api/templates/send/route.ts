import { NextResponse } from 'next/server';
import type { TemplateParameterInfo, TemplateParameters } from '@/types/whatsapp';
import { sendTemplate } from '@/lib/meta/whatsapp';
import { buildMetaTemplatePayload } from '@/lib/meta/template-payload';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, templateName, languageCode, parameters, parameterInfo } = body;

    if (!to || !templateName || !languageCode) {
      return NextResponse.json(
        { error: 'Missing required fields: to, templateName, languageCode' },
        { status: 400 }
      );
    }

    const template = buildMetaTemplatePayload({
      name: templateName,
      languageCode,
      parameters: parameters as TemplateParameters | undefined,
      parameterInfo: parameterInfo as TemplateParameterInfo | undefined
    });

    const result = await sendTemplate({ to, template });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending template:', error);
    return NextResponse.json(
      { error: 'Failed to send template message' },
      { status: 500 }
    );
  }
}
