import { decoder } from '../constants.ts';
import { MultipartReader, parse, readAll } from '../deps.ts';
import type { Min } from '../type.ts';

// 创建基础的mime类型的数组
function createMimeType(
  type?: Min.Mime.MimeTypeArray[number],
): Min.Mime.MimeTypeArray {
  if (type) {
    return [type];
  }
  return [];
}

export const MIME_JSON = createMimeType("application/json");
export const MIME_FORM = createMimeType("application/x-www-form-urlencoded");
export const MIME_MULTIPART = createMimeType("multipart/form-data");
export const MIME_TEXT = createMimeType();

/**
 * 检查mime的类型范围
 * @param {Min.Application.Ctx} ctx
 */
export function mimeTypeIs(ctx: Min.Application.Ctx) {
  const type = {
    Json: false,
    Form: false,
    Multipart: false,
    Text: false,
  };
  const contentType = ctx.originRequest.headers.get("Content-Type");
  parse: {
    if (contentType === null) {
      break parse;
    }
    if (MIME_JSON.some((item) => contentType.startsWith(item))) {
      type.Json = true;
      break parse;
    }
    if (MIME_FORM.some((item) => contentType.startsWith(item))) {
      type.Form = true;
      break parse;
    }
    if (MIME_MULTIPART.some((item) => contentType.startsWith(item))) {
      type.Multipart = true;
      break parse;
    }
    if (MIME_TEXT.some((item) => contentType.startsWith(item))) {
      type.Text = true;
      break parse;
    }
  }
  return type;
}

/**
 * 解析multipart/form-data类的body
 * @param {Min.Application.Ctx} ctx
 */
export async function parseFormData(ctx: Min.Application.Ctx) {
  try {
    const contentType = ctx.originRequest.headers.get('Content-Type');
    const boundary = contentType ? contentType.split('=')?.[1] : void 0;
    if (boundary) {
      const multipartReader = new MultipartReader(
        ctx.originRequest.r,
        boundary,
      );
      const formReadValue = await multipartReader.readForm();
      const formValue = {
        type: 'multipart',
        value: {},
        files: [],
      } as Min.Application.RequestBody<Record<string, string>> & {
        value: NonNullable<Min.Application.RequestBody<Record<string, string>>['value']>;
        files: NonNullable<Min.Application.RequestBody<Record<string, string>>['files']>;
      };
      for (const [key, value] of formReadValue.entries()) {
        if (value) {
          if (typeof value === 'string') {
            formValue.value[key] = value;
          } else if (Array.isArray(value)) {
            value.forEach((item) => formValue.files.push(item));
          } else {
            formValue.files.push(value);
          }
        }
      }
      ctx.request.body = formValue;
    } else {
      ctx.request.body = {
        type: 'multipart',
        value: void 0,
        files: void 0,
      };
    }
  } catch (_error) {
    ctx.request.body = {
      type: 'multipart',
      value: void 0,
      files: void 0,
    };
  }
}

/**
 * 解析application/json类的body
 * @param {Min.Application.Ctx} ctx
 */
export async function parseJson(ctx: Min.Application.Ctx) {
  try {
    const readContent = await readAll(ctx.originRequest.body);
    const body = decoder.decode(readContent);
    ctx.request.body = {
      type: 'json',
      value: JSON.parse(body),
      files: void 0,
    };
  } catch (_error) {
    ctx.request.body = {
      type: 'json',
      value: void 0,
      files: void 0,
    };
  }
}

/**
 * 解析application/x-www-form-urlencoded类的body
 * @param {Min.Application.Ctx} ctx
 */
export async function parseForm(ctx: Min.Application.Ctx) {
  try {
    const readContent = await readAll(ctx.originRequest.body);
    const body = decoder.decode(readContent);
    ctx.request.body = {
      type: 'form',
      value: parse(body),
      files: void 0,
    };
  } catch (_error) {
    ctx.request.body = {
      type: 'form',
      value: void 0,
      files: void 0,
    };
  }
}

/**
 * 解析text/plain类的body
 * @param {Min.Application.Ctx} ctx
 */
export async function parseText(ctx: Min.Application.Ctx) {
  try {
    const readContent = await readAll(ctx.originRequest.body);
    const body = decoder.decode(readContent);
    ctx.request.body = {
      type: 'text',
      value: body,
      files: void 0,
    };
  } catch (_error) {
    ctx.request.body = {
      type: 'text',
      value: void 0,
      files: void 0,
    };
  }
}

/**
 * 解析流body
 * @param {Min.Application.Ctx} ctx
 */
export async function parseUint8Array(ctx: Min.Application.Ctx) {
  try {
    const readContent = await readAll(ctx.originRequest.body);
    ctx.request.body = {
      type: 'uint8array',
      value: readContent,
      files: void 0,
    };
  } catch (_error) {
    ctx.request.body = {
      type: 'uint8array',
      value: void 0,
      files: void 0,
    };
  }
}