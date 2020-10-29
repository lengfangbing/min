import {colors, HTTPSOptions, serve, serveTLS, Status} from "./deps.ts";
import { Router } from "./router.ts";
import { Middleware } from "./middleware.ts";
import { parseAddress } from "./utils/parse/address.ts";
import {
  AppConfig, HandlerFunc,
  ListenOptions,
  MethodFuncArgument,
  MiddlewareFunc, NextFunc,
  Req,
  ReqMethod,
  Res,
  RouteHandlers,
  RoutesConfig,
  RouteValue,
} from "./model.ts";
import { cors } from "./cors.ts";
import { assets } from "./assets.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";

export const appConfig: AppConfig = {
  server: {
    port: 80,
    hostname: "127.0.0.1",
  },
};

export class Application {
  #router: Router;
  #middleware: Middleware;
  request: Request;
  response: Response;
  constructor() {
    this.#router = new Router();
    this.#middleware = new Middleware();
    this.request = new Request();
    this.response = new Response();
  }

  #add = (method: ReqMethod, url: string, handlers: RouteHandlers) => {
    const { handler, middleware } = handlers;
    this.#router.add(method, url, handler, middleware || []);
  };

  use(func: MiddlewareFunc) {
    if (typeof func !== "function") {
      throw new Error("use function arguments must be a function type");
    }
    this.#middleware.push(func);
    return this;
  }

  #setRoutes = async (routes: RoutesConfig[]) => {
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
        let fn: MiddlewareFunc | undefined = middleware[i];
        if (i === middleware.length) {
          fn = execFunc;
          response.status = execFunc ? Status.OK : Status.NotFound;
        }
        try {
          return fn && fn(request, response, dispatch.bind(null, index + 1) as NextFunc);
        } catch (err) {
          return Promise.reject(err);
        }
      }
    };
  };

  #handleRequest = async (request: Req, response: Res) => {
    const fv: RouteValue | null = this.#router.find(
      request.method,
      request.url,
    );
    const _m = this.#middleware.getMiddle();
    const m: MethodFuncArgument = [];
    let fn: HandlerFunc | undefined = undefined;
    _m.forEach((value: MiddlewareFunc) => {
      m.push(value);
    });
    if (fv) {
      const { middleware, handler, params, query, url } = fv;
      request.params = params;
      request.url = url;
      request.query = query;
      fn = handler;
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
    const f = this.#composeMiddle(m, request, response, fn);
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
        // 注入参数只能ignore了
        // deno-lint-ignore ban-ts-comment
        // @ts-ignore
        const res: Res = Response.createResponse();
        await this.#handleRequest(req, res);
      }
    } catch (e) {
      throw new Error(e);
    }
  };

  async listen(config: string | ListenOptions) {
    if (typeof config === "string") {
      appConfig.server = parseAddress(config);
    } else {
      appConfig.server = config as ListenOptions;
    }
    await this.#listen();
  }

  // 后续补充配置项
  // deno-lint-ignore no-explicit-any
  async start(config: any) {
    await this.#readConfig(config);
    await this.#listen();
  }
}
