import { getMiddlewareInitial, getRouterInitial } from "./entity.ts";
import { Request } from "../request.ts";
import { Response } from "../response.ts";
import {
  HandlerFunc,
  ListenOptions,
  MethodFuncArgument,
  MiddlewareFunc,
  Req,
  ReqMethod,
  Res,
  RouteHandlers,
  RoutesConfig,
} from "../model.ts";
import { RouteValue } from "./model.ts";
import { colors, HTTPSOptions, serve, serveTLS, Status } from "../deps.ts";
import { parseAddress } from "../utils/parse/address.ts";
import { cors } from "../cors.ts";
import { assets } from "../assets.ts";
import { appConfig } from "../application.ts";

export class DecorationApplication {
  request: Request;
  response: Response;
  constructor() {
    this.request = new Request();
    this.response = new Response();
  }

  #add = (method: ReqMethod, url: string, handlers: RouteHandlers) => {
    const { handler, middleware } = handlers;
    getRouterInitial().add(method, url, handler, middleware || []);
  };

  use(func: MiddlewareFunc) {
    if (typeof func !== "function") {
      throw new Error("use function arguments must be a function type");
    }
    getMiddlewareInitial().push(func);
    return this;
  }

  #setRoutes = async (routes: Array<RoutesConfig>) => {
    for (let i = 0; i < routes.length; i++) {
      const value = routes[i];
      const method: ReqMethod = value.method.toLowerCase() as ReqMethod;
      const { url, func, middleware = [] } = value;
      const handler = func;
      this.#add(method, url, { middleware, handler });
    }
  };

  #parseHandler = (handlers: MethodFuncArgument): RouteHandlers => {
    if (handlers.length < 1) {
      throw new Error("router has no match url or handler function");
    }
    const handler = handlers.pop();
    const res = {
      handler,
    } as RouteHandlers;
    if (handlers.length) {
      res.middleware = handlers;
    }
    return res;
  };

  get(path: string, ...handlers: MethodFuncArgument) {
    const funcHandler: RouteHandlers = this.#parseHandler(handlers);
    this.#add("get", path, funcHandler);
    return this;
  }

  post(path: string, ...handlers: MethodFuncArgument) {
    const funcHandler: RouteHandlers = this.#parseHandler(handlers);
    this.#add("post", path, funcHandler);
    return this;
  }

  put(path: string, ...handlers: MethodFuncArgument) {
    const funcHandler: RouteHandlers = this.#parseHandler(handlers);
    this.#add("put", path, funcHandler);
    return this;
  }

  delete(path: string, ...handlers: MethodFuncArgument) {
    const funcHandler: RouteHandlers = this.#parseHandler(handlers);
    this.#add("delete", path, funcHandler);
    return this;
  }

  options(path: string, ...handlers: MethodFuncArgument) {
    const funcHandler: RouteHandlers = this.#parseHandler(handlers);
    this.#add("options", path, funcHandler);
    return this;
  }

  head(path: string, ...handlers: MethodFuncArgument) {
    const funcHandler: RouteHandlers = this.#parseHandler(handlers);
    this.#add("head", path, funcHandler);
    return this;
  }

  connect(path: string, ...handlers: MethodFuncArgument) {
    const funcHandler: RouteHandlers = this.#parseHandler(handlers);
    this.#add("connect", path, funcHandler);
    return this;
  }

  trace(path: string, ...handlers: MethodFuncArgument) {
    const funcHandler: RouteHandlers = this.#parseHandler(handlers);
    this.#add("trace", path, funcHandler);
    return this;
  }

  patch(path: string, ...handlers: MethodFuncArgument) {
    const funcHandler: RouteHandlers = this.#parseHandler(handlers);
    this.#add("patch", path, funcHandler);
    return this;
  }

  #composeMiddle = (
    middleware: MethodFuncArgument,
    request: Req,
    response: Res,
    execFunc: HandlerFunc | undefined,
    exec: Array<string>,
  ) => {
    if (!Array.isArray(middleware)) {
      throw new TypeError("Middleware must be an array!");
    }
    return async function () {
      let index = -1;
      return dispatch(0);
      async function dispatch(i: number): Promise<unknown> {
        if (i <= index) {
          return Promise.reject(new Error("next() called multiple times"));
        }
        index = i;
        // deno-lint-ignore no-explicit-any
        let fn: ((...func: Array<any>) => Promise<void> | void) | undefined =
          middleware[i];
        if (i === middleware.length) {
          fn = execFunc;
          response.status = execFunc ? Status.OK : Status.NotFound;
        }
        try {
          // 表示这是处理函数了
          if (index === middleware.length) {
            // 以参数的顺序正序排列的数组
            const args = [...exec].reverse();
            if (args.length) {
              const pArgs = args.map((value) => {
                // 完成反射需要动态获取类型不定的值
                // deno-lint-ignore no-explicit-any
                let val: any = request;
                const paramKey = value.split(".");
                paramKey.forEach((value1) => {
                  val = val[value1];
                });
                return val;
              });
              return fn && fn(...pArgs, response, request);
            }
          }
          return fn && fn(request, response, dispatch.bind(null, index + 1));
        } catch (err) {
          return Promise.reject(err);
        }
      }
    };
  };

  #handleRequest = async (request: Req, response: Res) => {
    const fv: RouteValue | null = getRouterInitial().find(
      request.method,
      request.url,
    );
    const _m = getMiddlewareInitial().getMiddle();
    const m: MethodFuncArgument = [];
    let fn: HandlerFunc | undefined = undefined;
    _m.forEach((value: MiddlewareFunc) => {
      m.push(value);
    });
    let exs: Array<string> = [];
    if (fv) {
      const { middleware, handler, params, query, url, exec } = fv;
      request.params = params;
      request.url = url;
      request.query = query;
      fn = handler;
      exs = exec;
      middleware.forEach((value: MiddlewareFunc) => {
        m.push(value);
      });
    }
    await this.request.parseBody(request);
    // 注入参数只能ignore了
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    response.redirect = response.redirect.bind(globalThis, response);
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    response.render = response.render.bind(globalThis, response);
    const f = this.#composeMiddle(m, request, response, fn, exs);
    await f.call(globalThis);
    response.send(request, response);
  };

  // 后续补充配置项
  // deno-lint-ignore no-explicit-any
  #readConfig = async (config: any) => {
    // config.constructor === undefined => config = await import('./min.config.ts')
    config = config.constructor ? config : config.default;
    const { server, routes, cors: corsConfig, assets: assetsConfig = "" } =
      config;
    // set server config
    appConfig.server = server.addr
      ? { ...server, ...parseAddress(server.addr) }
      : server;
    routes?.length &&
      await this.#setRoutes(routes);
    corsConfig &&
      this.use(cors(corsConfig));
    this.use(assets(assetsConfig));
  };

  #listen = async (): Promise<void> => {
    const server = appConfig.server;
    const isTls = server.secure;
    const protocol = isTls ? "https" : "http";
    try {
      const Server = isTls ? serveTLS(server as HTTPSOptions) : serve(server);
      console.log(
        colors.white(
          `server is listening ${protocol}://${server.hostname}:${server.port} `,
        ),
      );
      for await (const request of Server) {
        const req: Req = Request.createRequest({
          url: request.url,
          method: request.method.toLowerCase() as ReqMethod,
          headers: request.headers,
          request,
        });
        // deno-lint-ignore ban-ts-comment
        // @ts-ignore
        const res: Res = Response.createResponse();
        this.#handleRequest(req, res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  async listen(config: string | ListenOptions) {
    if (typeof config === "string") {
      appConfig.server = parseAddress(config);
    } else {
      appConfig.server = config as ListenOptions;
    }
    this.#listen();
  }

  // 配置文件后续再补充类型
  // deno-lint-ignore no-explicit-any
  async start(config: any) {
    await this.#readConfig(config);
    this.#listen();
  }
}
