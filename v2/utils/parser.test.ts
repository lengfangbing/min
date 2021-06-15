import { assertEquals, join, parse, StringReader } from "../deps.ts";
import {
  mimeTypeIs,
  parseForm,
  parseFormData,
  parseJson,
  parseText,
  parseUint8Array,
} from "./mime.test.ts";
import type { Min } from "../type.ts";
import { getHeaders } from "./helper.test.ts";
import { encoder } from "../constants.ts";

/**
 * 格式化uri, 默认导出的格式为a/b/c, format uri, the default return value is a/b/c
 * @param {string} uri 要转换的uri, uri need formatted
 * @param {string} [startSeq] 在默认的格式前面添加的字符, seq add before default uri
 * @param {string} [endSeq]  在默认的格式后面添加的字符, seq append default uri
 */
export function formatUri(uri: string, startSeq = "", endSeq = "") {
  let flagUri = String(uri);
  // 对uri进行前后的'/'删除
  while (flagUri.endsWith("/")) {
    flagUri = flagUri.slice(0, flagUri.length - 1);
  }
  while (flagUri.startsWith("/")) {
    flagUri = flagUri.slice(1);
  }
  return `${startSeq}${flagUri}${endSeq}`;
}

export function parseRouteUri(uri: string): Array<string>;
export function parseRouteUri(
  uri: string,
  isRouteParse: boolean,
): Min.Parser.RouteUri;
/**
 * 解析uri路径
 * @param {string} uri 需要进行解析的路由路径, need parsed uri
 * @param {boolean} [isRouteParse] 是否是路由uri解析, 如果是false, 则只会split, whether the uri is for route, default false
 */
export function parseRouteUri(uri: string, isRouteParse?: boolean) {
  const flagUri = formatUri(uri);
  const splitedUri = flagUri.split("/");
  // 如果不是路由uri解析, 是普通的请求uri解析
  if (!isRouteParse) {
    return splitedUri;
  }
  // 构造解析后的uri数组
  return splitedUri.reduce(
    (prev: Min.Parser.RouteUri, curr, _index, arr: Min.Parser.RouteUri) => {
      if (prev.length === 0) {
        arr = [];
      }
      if (curr.startsWith("*")) {
        arr = [...prev, { type: "global", paramName: curr.slice(1) }];
      } else if (curr.startsWith(":")) {
        arr = [...prev, { type: "dynamic", paramName: curr.slice(1) }];
      } else {
        arr = [...prev, curr];
      }
      return arr;
    },
    [],
  );
}

Deno.test({
  name: "parse single request uri test case",
  fn() {
    assertEquals(
      ["api", "v1", "test"],
      parseRouteUri("api/v1/test"),
    );
  },
});

Deno.test({
  name: "parse single route uri test case",
  fn() {
    assertEquals(
      ["api", "v1", "test"],
      parseRouteUri("api/v1/test", true),
    );
  },
});

Deno.test({
  name: "parse dynamic request uri test case",
  fn() {
    assertEquals(
      ["api", "v1", ":test"],
      parseRouteUri("/api/v1/:test"),
    );
  },
});

Deno.test({
  name: "parse dynamic route uri test case",
  fn() {
    assertEquals(
      ["api", "v1", { type: "dynamic", paramName: "test" }],
      parseRouteUri("/api/v1/:test", true),
    );
  },
});

Deno.test({
  name: "parse global request uri test case",
  fn() {
    assertEquals(
      ["api", "v1", "*name"],
      parseRouteUri("/api/v1/*name"),
    );
  },
});

Deno.test({
  name: "parse global route uri test case",
  fn() {
    assertEquals(
      ["api", "v1", { type: "global", paramName: "name" }],
      parseRouteUri("/api/v1/*name", true),
    );
  },
});

/**
 * 解析请求的uri和query
 * @param {string} uri 要解析的uri, uri need parsed
 */
export function parseUriAndQuery<
  T extends Record<string, unknown> = Record<string, unknown>,
>(uri: string) {
  const [originUri, queryString] = uri.split("?");
  return {
    uri: formatUri(originUri, "/"),
    query: queryString ? parse(queryString) as T : {} as T,
  };
}

Deno.test({
  name: "parse uri and query test case1",
  fn() {
    assertEquals(
      {
        uri: "/api/test/v1",
        query: {},
      },
      parseUriAndQuery("/api/test/v1"),
    );
  },
});

Deno.test({
  name: "parse uri and query test case2",
  fn() {
    assertEquals(
      {
        uri: "/api/test/v1",
        query: {},
      },
      parseUriAndQuery("/api/test/v1/"),
    );
  },
});

Deno.test({
  name: "parse uri and query test case3",
  fn() {
    assertEquals(
      {
        uri: "/api/test/v1",
        query: {},
      },
      parseUriAndQuery("/api/test/v1?"),
    );
  },
});

Deno.test({
  name: "parse uri and query test case4",
  fn() {
    assertEquals(
      {
        uri: "/api/test/v1",
        query: {},
      },
      parseUriAndQuery("/api/test/v1/?"),
    );
  },
});

Deno.test({
  name: "parse uri and query test case5",
  fn() {
    assertEquals(
      {
        uri: "/api/test/v1",
        query: {
          name: "123",
          age: "20",
        },
      },
      parseUriAndQuery("/api/test/v1/?name=123&age=20"),
    );
  },
});

Deno.test({
  name: "parse uri and query test case6",
  fn() {
    assertEquals(
      {
        uri: "/api/test/v1",
        query: {
          name: "123",
          age: "20",
          love: ["2017", "2018", "2019", "2020"],
        },
      },
      parseUriAndQuery(
        "/api/test/v1/?name=123&age=20&love=2017&love=2018&love=2019&love=2020",
      ),
    );
  },
});

export async function parseRequestBody(ctx: Min.Application.Ctx) {
  // 判断当前请求体是什么类型
  const typeIs = mimeTypeIs(ctx);
  // 根据content-type的类型就行解析
  if (typeIs.Multipart) {
    await parseFormData(ctx);
  } else {
    if (typeIs.Json) {
      await parseJson(ctx);
    } else if (typeIs.Form) {
      await parseForm(ctx);
    } else if (typeIs.Text) {
      await parseText(ctx);
    } else {
      await parseUint8Array(ctx);
    }
  }
}

Deno.test({
  name: "test parse form-data request body",
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
    Deno.close(testFormData.rid);
    assertEquals(ctx.request.body.type, "multipart");
    assertEquals(ctx.request.body.value?.name, "冷方冰");
    assertEquals(ctx.request.body.value?.age, "24");
  },
});

Deno.test({
  name: "test parse JSON data request body",
  async fn() {
    const ctx = {
      originRequest: {
        body: new StringReader(JSON.stringify({ name: "冷方冰", age: 24 })),
        headers: getHeaders({
          "Content-Type": "application/json",
        }),
      },
      request: {},
    } as unknown as Min.Application.Ctx;
    await parseJson(ctx);
    assertEquals(ctx.request.body.type, "json");
    assertEquals(ctx.request.body.value, { name: "冷方冰", age: 24 });
  },
});

Deno.test({
  name: "test parse form data request body",
  async fn() {
    const ctx = {
      originRequest: {
        body: new StringReader("name=冷方冰&age=24"),
        headers: getHeaders({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      },
      request: {},
    } as unknown as Min.Application.Ctx;
    await parseForm(ctx);
    assertEquals(ctx.request.body.type, "form");
    assertEquals(ctx.request.body.value, { name: "冷方冰", age: "24" });
  },
});

Deno.test({
  name: "test parse text data request body",
  async fn() {
    const ctx = {
      originRequest: {
        body: new StringReader("冷方冰帅啊"),
        headers: getHeaders({
          "Content-Type": "plain/text",
        }),
      },
      request: {},
    } as unknown as Min.Application.Ctx;
    await parseText(ctx);
    assertEquals(ctx.request.body.type, "text");
    assertEquals(ctx.request.body.value, "冷方冰帅啊");
  },
});

Deno.test({
  name: "test parse uint8array data request body",
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
