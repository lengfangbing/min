import { assertEquals } from '../deps.ts';
import type { Min } from '../type.ts';

// 创建基础的mime类型的数组
function createMimeType(type?: Min.Mime.MidiaTypeArray[number]): Min.Mime.MidiaTypeArray {
	if (type) {
		return [type];
	}
	return [];
}

// 类JSON的数组
export const MIME_JSON = createMimeType('application/json');
// 类FORM的数组
export const MIME_FORM = createMimeType('application/x-www-form-urlencoded');
// 类multipart的数组
export const MIME_MULTIPART = createMimeType('multipart/form-data');
// 类text的数组, 默认当其他三种类型不满足时, 当作text处理
export const MIME_TEXT = createMimeType();

// 根据contentType进行判断mime类型的方法
export function mimeTypeIs(ctx: Min.Application.Ctx) {
	const type = {
		Json: false,
		Form: false,
		Multipart: false,
		Text: false,
	};
	const contentType = ctx.originRequest.headers.get('Content-Type');
	// 优先级 Json > Form > Multipart > Text
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

function createCtx() {
	return {
		originRequest: {
			headers: new Headers(),
		},
	} as Min.Application.Ctx;
}

Deno.test({
	name: 'test mime type',
	fn() {
		const ctx = createCtx();
		ctx.originRequest.headers.set('content-type', 'application/json');
		assertEquals(mimeTypeIs(ctx).Json, true);
		ctx.originRequest.headers.set('content-type', 'application/x-www-form-urlencoded');
		assertEquals(mimeTypeIs(ctx).Form, true);
		ctx.originRequest.headers.set('content-type', 'multipart/form-data');
		assertEquals(mimeTypeIs(ctx).Multipart, true);
		ctx.originRequest.headers.set('content-type', '');
		assertEquals(mimeTypeIs(ctx).Text, true);
	}
});