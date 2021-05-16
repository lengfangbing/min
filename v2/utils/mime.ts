import type { Min } from '../type.ts';

// 创建基础的mime类型的数组
function createMimeType(type?: Min.Mime.MidiaTypeArray[number]): Min.Mime.MidiaTypeArray {
	if (type) {
		return [type];
	}
	return [];
}

export const MIME_JSON = createMimeType('application/json');
export const MIME_FORM = createMimeType('application/x-www-form-urlencoded');
export const MIME_MULTIPART = createMimeType('multipart/form-data');
export const MIME_TEXT = createMimeType();

export function mimeTypeIs(ctx: Min.Application.Ctx) {
	const type = {
		Json: false,
		Form: false,
		Multipart: false,
		Text: false,
	};
	const contentType = ctx.originRequest.headers.get('Content-Type');
	parse: {
		if (contentType === null) {
			type.Text = true;
			break parse;
		}
		if (MIME_JSON.includes(contentType)) {
			type.Json = true;
			break parse;
		}
		if (MIME_FORM.includes(contentType)) {
			type.Form = true;
			break parse;
		}
		if (MIME_MULTIPART.includes(contentType)) {
			type.Multipart = true;
			break parse;
		}
		type.Text = true;
	}
	return type;
}