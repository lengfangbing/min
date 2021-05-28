import { decoder, encoder } from '../constants.ts';
import { assertEquals, join, MultipartReader, parse, readAll, StringReader } from '../deps.ts';
import type { Min } from '../type.ts';
import { getHeaders } from './helper.test.ts';

// 创建基础的mime类型的数组
function createMimeType(
  type?: Min.Mime.MimeTypeArray[number],
): Min.Mime.MimeTypeArray {
  if (type) {
    return [type];
  }
  return [];
}

// 类JSON的数组
export const MIME_JSON = createMimeType("application/json");
// 类FORM的数组
export const MIME_FORM = createMimeType("application/x-www-form-urlencoded");
// 类multipart的数组
export const MIME_MULTIPART = createMimeType("multipart/form-data");
// 类text的数组, 默认当其他三种类型不满足时, 当作text处理
export const MIME_TEXT = createMimeType("plain/text");

// 根据contentType进行判断mime类型的方法
export function mimeTypeIs(ctx: Min.Application.Ctx) {
  const type = {
    Json: false,
    Form: false,
    Multipart: false,
    Text: false,
  };
  const contentType = ctx.originRequest.headers.get("Content-Type");
  // 优先级 Json > Form > Multipart > Text
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

function createCtx() {
  return {
    originRequest: {
      headers: new Headers(),
    },
  } as Min.Application.Ctx;
}

Deno.test({
  name: "test mime type",
  fn() {
    const ctx = createCtx();
    ctx.originRequest.headers.set("content-type", "application/json");
    assertEquals(mimeTypeIs(ctx).Json, true);
    ctx.originRequest.headers.set(
      "content-type",
      "application/x-www-form-urlencoded",
    );
    assertEquals(mimeTypeIs(ctx).Form, true);
    ctx.originRequest.headers.set("content-type", "multipart/form-data");
    assertEquals(mimeTypeIs(ctx).Multipart, true);
    ctx.originRequest.headers.set("content-type", "");
    assertEquals(mimeTypeIs(ctx).Text, false);
    assertEquals(mimeTypeIs(ctx).Json, false);
    assertEquals(mimeTypeIs(ctx).Multipart, false);
    assertEquals(mimeTypeIs(ctx).Form, false);
  },
});

// 解析multipart/form-data
export async function parseFormData(ctx: Min.Application.Ctx) {
  try {
    // 获取content-type
    const contentType = ctx.originRequest.headers.get("Content-Type");
    // 如果是FormData
    const boundary = contentType ? contentType.split("=")?.[1] : void 0;
    if (boundary) {
      const multipartReader = new MultipartReader(
        ctx.originRequest.r,
        boundary,
      );
      // @TODO 待增加readForm的配置项
      const formReadValue = await multipartReader.readForm();
      const formValue = {
        type: "multipart",
        value: {},
        files: [],
      } as Min.Application.RequestBody<Record<string, string>> & {
        value: NonNullable<
          Min.Application.RequestBody<Record<string, string>>["value"]
        >;
        files: NonNullable<
          Min.Application.RequestBody<Record<string, string>>["files"]
        >;
      };
      for (const [key, value] of formReadValue.entries()) {
        // 只有value存在时才进行解析
        if (value) {
          if (typeof value === "string") {
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
      // boundary不存在, 就不进行解析
      ctx.request.body = {
        type: "multipart",
        value: void 0,
        files: void 0,
      };
    }
  } catch (_error) {
    ctx.request.body = {
      type: "multipart",
      value: void 0,
      files: void 0,
    };
  }
}

// 解析application/json
export async function parseJson(ctx: Min.Application.Ctx) {
  try {
    // get net request body text
    const readContent = await readAll(ctx.originRequest.body);
    const body = decoder.decode(readContent);
    ctx.request.body = {
      type: "json",
      value: JSON.parse(body),
      files: void 0,
    };
  } catch (_error) {
    ctx.request.body = {
      type: "json",
      value: void 0,
      files: void 0,
    };
  }
}

// 解析form
export async function parseForm(ctx: Min.Application.Ctx) {
  try {
    // get net request body text
    const readContent = await readAll(ctx.originRequest.body);
    const body = decoder.decode(readContent);
    ctx.request.body = {
      type: "form",
      value: parse(body),
      files: void 0,
    };
  } catch (_error) {
    ctx.request.body = {
      type: "form",
      value: void 0,
      files: void 0,
    };
  }
}

// 解析text
export async function parseText(ctx: Min.Application.Ctx) {
  try {
    // get net request body text
    const readContent = await readAll(ctx.originRequest.body);
    const body = decoder.decode(readContent);
    ctx.request.body = {
      type: "text",
      value: body,
      files: void 0,
    };
  } catch (_error) {
    ctx.request.body = {
      type: "text",
      value: void 0,
      files: void 0,
    };
  }
}

// 解析Unit8Array
export async function parseUint8Array(ctx: Min.Application.Ctx) {
  try {
    // get net request body text
    const readContent = await readAll(ctx.originRequest.body);
    ctx.request.body = {
      type: "uint8array",
      value: readContent,
      files: void 0,
    };
  } catch (_error) {
    ctx.request.body = {
      type: "uint8array",
      value: void 0,
      files: void 0,
    };
  }
}

Deno.test({
  name: "test parse form-data",
  async fn() {
    const testFormData = await Deno.open(
      join(Deno.cwd(), "../test_files/multipart.txt"),
    );
    const ctx = {
      originRequest: {
        r: testFormData,
        headers: getHeaders({
          "Content-Type":
            "multipart/form-data; boundary=--------------------------434049563556637648550474",
        }),
      },
      request: {},
    } as unknown as Min.Application.Ctx;
    await parseFormData(ctx);
    testFormData.close();
    assertEquals(ctx.request.body.type, "multipart");
    assertEquals(ctx.request.body.value?.name, "冷方冰");
    assertEquals(ctx.request.body.value?.age, "24");
  },
});

Deno.test({
  name: "test parse JSON data",
  async fn() {
    const ctx = {
      originRequest: {
        body: new StringReader(JSON.stringify({ name: "冷方冰", age: 24 })),
      },
      request: {},
    } as unknown as Min.Application.Ctx;
    await parseJson(ctx);
    assertEquals(ctx.request.body.type, "json");
    assertEquals(ctx.request.body.value, { name: "冷方冰", age: 24 });
  },
});

Deno.test({
  name: "test parse form data",
  async fn() {
    const ctx = {
      originRequest: {
        body: new StringReader("name=冷方冰&age=24"),
      },
      request: {},
    } as unknown as Min.Application.Ctx;
    await parseForm(ctx);
    assertEquals(ctx.request.body.type, "form");
    assertEquals(ctx.request.body.value, { name: "冷方冰", age: "24" });
  },
});

Deno.test({
  name: "test parse text data",
  async fn() {
    const ctx = {
      originRequest: {
        body: new StringReader("冷方冰帅啊"),
      },
      request: {},
    } as unknown as Min.Application.Ctx;
    await parseText(ctx);
    assertEquals(ctx.request.body.type, "text");
    assertEquals(ctx.request.body.value, "冷方冰帅啊");
  },
});

Deno.test({
  name: "test parse uint8array data",
  async fn() {
    const ctx = {
      originRequest: {
        body: new StringReader("冷方冰帅啊"),
      },
      request: {},
    } as unknown as Min.Application.Ctx;
    await parseUint8Array(ctx);
    assertEquals(ctx.request.body.type, "uint8array");
    assertEquals(ctx.request.body.value, encoder.encode("冷方冰帅啊"));
  },
});
