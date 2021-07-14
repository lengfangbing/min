import { resolve, serve, ServerRequest, serveTLS } from "./deps.ts";
import { Request } from "./request.test.ts";
import { DEFAULT_STATUS } from "./utils/respond.test.ts";
import { file, json, redirect, render, text } from "./utils/helper.test.ts";
import {
  Get,
  Middleware,
  Query,
  Route,
} from "./decorator/method.test.ts";
import { decoder } from "./constants.ts";
import type { Min, MinConfig } from "./type.ts";
import type { HTTPSOptions } from './deps.ts';

export class Application {
  readConfig: MinConfig | void = void 0;
  // 创建上下文变量Ctx
  #createCtx = (req: ServerRequest): Min.Application.Ctx => {
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

  // 读取min.config.ts的配置
  async readConfigFile(): Promise<MinConfig> {
    // 避免每次都去读取配置文件
    if (this.readConfig) {
      return this.readConfig;
    }
    const filePath = resolve(Deno.cwd(), 'min.config.ts');
    const file = await import(filePath);
    return (this.readConfig = JSON.parse(decoder.decode(file)) as MinConfig);
  }

  // start启动, 如果传入了MinConfig，那么就不需要再去读取min.config.ts文件了
  async start(config?: MinConfig) {
    // 获取配置信息
    const minConfig = config || await this.readConfigFile();
    const serverConfig = minConfig.server;
    let server;
    // 判断是否是https
    if (serverConfig.certFile && serverConfig.keyFile) {
      server = serveTLS(serverConfig as HTTPSOptions);
    } else {
      server = serve(serverConfig as HTTPSOptions);
    }
    for await (const request of server) {
      const originRequest = request;
      // 自定义的Application
      const customApplication = minConfig.application;
      // 检查是否有自定义ctx的实现
      let ctx = this.#createCtx(originRequest);
      if (customApplication?.customCtx) {
        ctx = await customApplication.customCtx(originRequest, ctx);
      }
      // 检查是否有自定义的callback的实现
      if (customApplication?.callback) {
        const callback = await customApplication.callback(originRequest, ctx);
        // 如果callback是false，则表示不需要继续往下执行，直接return就可以
        if (!callback) {
          return;
        }
      }
      // 执行内部逻辑
      await new Request().handleRequest(ctx);
    }
  }
}

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
  const PORT = 4000;
  const HOST = "127.0.0.1";
  await app.start({
    server: {
      port: PORT,
      hostname: HOST,
    }
  });
  new Test();
}

testCase();