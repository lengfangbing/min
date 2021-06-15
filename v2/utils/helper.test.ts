import { assertEquals, join, Status } from '../deps.ts';
import { Min } from '../type.ts';

/**
 * 仅用于单测时的辅助函数
 * @param {Record<string, string>} [value] 要映射成Header的k-v
 */
export function getHeaders(value?: Record<string, string>) {
  const headers = new Headers();
  Object.keys(value || {}).forEach((item) => {
    headers.set(item, (value || {})[item]);
  });
  return headers;
}

/**
 * 简化的body返回json数据
 * @param {Min.Application.Ctx} ctx
 * @param {Record<string, any>} value
 */
export function json<T extends Record<string, unknown> = Record<string, unknown>>(
  ctx: Min.Application.Ctx<T>,
  value: T,
) {
  // 设置响应头
  ctx.response.headers.set('Content-Type', 'application/json');
  // 设置相应status
  ctx.response.status = Status.OK;
  // 设置body
  ctx.response.body = value;
}

/**
 * 简化的body返回file数据
 * @param {Min.Application.Ctx} ctx
 * @param {string | Uint8Array} unknownValue - 如果是string，则会读取路径的文件；如果是Uint8Array，则会设置body值
 * @param {string} [contentType] - 可选的content-type
 */
export async function file(
  ctx: Min.Application.Ctx<Uint8Array>,
  unknownValue: string | Uint8Array,
  contentType?: string,
) {
  // 设置响应头
  ctx.response.headers.set('Content-Type', contentType || 'application/octet-stream');
  // 设置status
  ctx.response.status = Status.OK;
  // 设置body
  let fileRef: Uint8Array;
  if (typeof unknownValue === 'string') {
    fileRef = await Deno.readFile(unknownValue);
  } else {
    fileRef = unknownValue;
  }
  ctx.response.body = fileRef;
}

/**
 * 简化的body返回字符串
 * @param {Min.Application.Ctx} ctx
 * @param {string} value
 */
export function text(
  ctx: Min.Application.Ctx,
  value: string,
) {
  // 设置响应头
  ctx.response.headers.set('Content-Type', 'text/plain');
  // 设置相应status
  ctx.response.status = Status.OK;
  // 设置body
  ctx.response.body = value;
}

/**
 * 简化的body返回html文件
 * @param {Min.Application.Ctx} ctx
 * @param {string | Uint8Array} unknownValue - 如果是string，则会读取路径的文件；如果是Uint8Array，则会设置body值
 * @param {string} [contentType] - 可选的content-type，默认是text/html
 */
export async function render(
  ctx: Min.Application.Ctx<Uint8Array>,
  unknownValue: string | Uint8Array,
  contentType = 'text/html',
) {
  await file(ctx, unknownValue, contentType);
}

/**
 * 简化的重定向的方法
 * @param {Min.Application.Ctx} ctx
 * @param {string} location - 要重定向的路径url
 */
export function redirect(
  ctx: Min.Application.Ctx,
  location: string,
  status = Status.Found
) {
  // 设置header
  ctx.response.headers.set('Location', location);
  // 设置status
  ctx.response.status = status;
}

function createCtx<T>(otherConfig?: Partial<Min.Application.Ctx<T>>) {
  return {
    response: {
      headers: new Headers(),
    },
    ...otherConfig,
  } as Min.Application.Ctx<T>;
}

Deno.test({
  name: 'ctx json',
  fn() {
    const ctx = createCtx<Record<string, unknown>>();
    ctx.json = json.bind(null, ctx);
    ctx.json({
      name: 'lfb',
      age: 23
    });
    assertEquals(ctx.response.body, { name: 'lfb', age: 23 });
  }
});

Deno.test({
  name: 'ctx file',
  async fn() {
    const ctx = createCtx<Uint8Array>();
    ctx.file = file.bind(null, ctx);
    const filePath = join(Deno.cwd(), '../test_files/multipart.txt');
    const readFile = Deno.readFileSync(filePath);
    await ctx.file(filePath);
    assertEquals(readFile, ctx.response.body);
    await ctx.file(readFile);
    assertEquals(readFile, ctx.response.body);
  },
  sanitizeResources: false,
  sanitizeOps: false
});

Deno.test({
  name: 'ctx text',
  fn() {
    const ctx = createCtx<string>();
    ctx.text = text.bind(null, ctx);
    ctx.text('123');
    assertEquals('123', ctx.response.body);
  }
});

Deno.test({
  name: 'ctx render',
  async fn() {
    const ctx = createCtx<Uint8Array>();
    ctx.render = render.bind(null, ctx);
    const filePath = join(Deno.cwd(), '../test_files/multipart.txt');
    const readFile = Deno.readFileSync(filePath);
    await ctx.render(filePath);
    assertEquals(readFile, ctx.response.body);
    assertEquals('text/html', ctx.response.headers.get('Content-Type'));
    ctx.render(filePath, 'text/plain');
    assertEquals('text/plain', ctx.response.headers.get('Content-Type'));
  },
  sanitizeResources: false,
  sanitizeOps: false
});

Deno.test({
  name: 'ctx redirect',
  fn() {
    const ctx = createCtx<string>();
    ctx.redirect = redirect.bind(null, ctx);
    ctx.redirect('https://www.google.com', Status.MovedPermanently);
    assertEquals('https://www.google.com', ctx.response.headers.get('Location'));
    assertEquals(Status.MovedPermanently, ctx.response.status);
  },
  sanitizeResources: false,
  sanitizeOps: false
});