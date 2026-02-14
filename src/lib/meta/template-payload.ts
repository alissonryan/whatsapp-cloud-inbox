import type { TemplateParameterInfo, TemplateParameters } from '@/types/whatsapp';
import type { MetaTemplatePayload } from '@/lib/meta/whatsapp';

type TextParameter = { type: 'text'; text: string; parameter_name?: string };

function getParameterValue(parameters: TemplateParameters, paramName: string, index: number): unknown {
  if (Array.isArray(parameters)) return parameters[index];
  return parameters[paramName];
}

export function buildMetaTemplatePayload(args: {
  name: string;
  languageCode: string;
  parameters?: TemplateParameters;
  parameterInfo?: TemplateParameterInfo;
}): MetaTemplatePayload {
  const payload: MetaTemplatePayload = {
    name: args.name,
    language: { code: args.languageCode }
  };

  if (!args.parameters || !args.parameterInfo || args.parameterInfo.parameters.length === 0) {
    return payload;
  }

  const headerParams: TextParameter[] = [];
  const bodyParams: TextParameter[] = [];
  const buttonParamsByIndex = new Map<number, TextParameter[]>();

  args.parameterInfo.parameters.forEach((paramDef, index) => {
    const rawValue = getParameterValue(args.parameters as TemplateParameters, paramDef.name, index);
    if (rawValue === undefined || rawValue === null) return;

    const textValue = String(rawValue);
    if (!textValue.trim()) return;

    const param: TextParameter = {
      type: 'text',
      text: textValue,
      ...(args.parameterInfo?.format === 'NAMED' ? { parameter_name: paramDef.name } : {})
    };

    if (paramDef.component === 'HEADER') {
      headerParams.push(param);
      return;
    }

    if (paramDef.component === 'BODY') {
      bodyParams.push(param);
      return;
    }

    if (paramDef.component === 'BUTTON' && typeof paramDef.buttonIndex === 'number') {
      const list = buttonParamsByIndex.get(paramDef.buttonIndex) ?? [];
      list.push(param);
      buttonParamsByIndex.set(paramDef.buttonIndex, list);
    }
  });

  const components: Array<Record<string, unknown>> = [];

  if (headerParams.length > 0) {
    components.push({
      type: 'header',
      parameters: headerParams
    });
  }

  if (bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParams
    });
  }

  for (const [buttonIndex, params] of [...buttonParamsByIndex.entries()].sort((a, b) => a[0] - b[0])) {
    if (params.length === 0) continue;
    components.push({
      type: 'button',
      sub_type: 'url',
      index: String(buttonIndex),
      parameters: params
    });
  }

  if (components.length > 0) {
    payload.components = components;
  }

  return payload;
}

