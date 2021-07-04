import { assertEquals, serve, ServerRequest, Status } from "./deps.ts";
import { Request } from "./request.test.ts";
import { DEFAULT_STATUS } from "./utils/respond.test.ts";
import { file, json, redirect, render, text } from "./utils/helper.test.ts";
import type { Min } from "./type.ts";
import {
  Get,
  Middleware,
  Query,
  Route,
} from "./decorator/method.test.ts";

// type alias
export type Ctx = Min.Application.Ctx;

const PORT = 4000;
const HOST = "127.0.0.1";

export class Application {
  // 创建上下文变量Ctx
  #createCtx = (req: ServerRequest): Ctx => {
    return {
      originRequest: req,
      originResponse: {},
      request: {
        query: {},
        url: req.url,
        params: {},
        method: req.method,
        headers: req.headers,
        // cookie: getCookies(req),
        body: {
          type: "text",
          value: void 0,
          files: void 0,
        },
      },
      response: {
        headers: new Headers(),
        body: "",
        status: DEFAULT_STATUS,
        // cookie: {},
      },
      json: json as unknown as Min.Application.Ctx["json"],
      file: file as unknown as Min.Application.Ctx["file"],
      text: text as unknown as Min.Application.Ctx["text"],
      redirect: redirect as unknown as Min.Application.Ctx["redirect"],
      render: render as unknown as Min.Application.Ctx["render"],
    };
  };
  // start启动, 先看一下req和res然后再进行处理
  async start() {
    const server = serve({
      hostname: HOST,
      port: PORT,
    });
    for await (const request of server) {
      const originRequest = request;
      const ctx = this.#createCtx(originRequest);
      await new Request().handleRequest(ctx);
    }
  }
}

/**
 * test case
 */

Deno.test({
  name: "test fetch result",
  async fn() {
    const app = new Application();
    app.start();
    const testResult = await fetch("http://127.0.0.1:3000");
    const testText = await testResult.text();
    assertEquals(testText, "hello world");
  },
});

Deno.test({
  name: "test fetch status",
  async fn() {
    const app = new Application();
    app.start();
    const testResult = await fetch("http://127.0.0.1:3000");
    const testText = await testResult.text();
    assertEquals(testResult.status, Status.OK);
  },
});

@Route('/api')
class Test {
  @Middleware
  async globalMiddle1(_ctx: Min.Application.Ctx, next: Min.Middleware.NextFunc) {
    console.log("global middleware1");
    await next();
  }

  @Get("/v1", async (_, next: Min.Middleware.NextFunc) => { await next() }, async (_, next: Min.Middleware.NextFunc) => { await next() })
  handler(@Query() _query: unknown, @Query("name") _name: unknown) {
    console.log(_query);
    console.log(_name);
  }

  @Get("/v2")
  handler2(@Query() _query: unknown, @Query("name2") _name: unknown) {
    console.log(_query);
    console.log(_name);
  }

  @Middleware
  async globalMiddle2(_ctx: Min.Application.Ctx, next: Min.Middleware.NextFunc) {
    console.log("global middleware2");
    await next();
  }
}

async function testCase() {
  const app = new Application();
  await app.start();
  new Test();
}

testCase();