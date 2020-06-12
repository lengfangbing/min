import {
  parseParamsName,
  parseParamsValue,
} from "./utils/url/url.ts";
import {
  ServerRequest,
  Status
} from "./deps.ts";
import {
  Req,
  ReqMethod,
  Res
} from "./http.ts";
import {
  Middleware
} from "./middleware.ts";
import {
  MethodMapValue, 
  ReqObjectField
} from './model.ts';
import {
  Request
} from "./request.ts";
import {
  Response
} from "./response.ts";

export class Router {
  #tree: Record<string, Record<string, MethodMapValue>>;
  middleware: Middleware
  request: Request
  response: Response

  constructor() {
    this.#tree = {
      get: {},
      post: {},
      put: {},
      delete: {},
      options: {},
      head: {},
      connect: {},
      trace: {},
      patch: {},
    };
    this.middleware = new Middleware();
    this.request = new Request();
    this.response = new Response();
  }

  async handleRoute(request: ServerRequest) {
    const req: Req = Request.createRequest({
      url: request.url,
      method: request.method.toLowerCase() as ReqMethod,
      headers: request.headers,
      request
    });
    const res: Res = Response.createResponse();
    await this.#handleRequest(req, res);
  }

  #handleRequest = async (request: Req, response: Res) => {
    this.request.parseUrlAndQuery(request);
    const { url, method } = request;
    let fv: MethodMapValue | null = this.find(method, url);
    let fn: Function | undefined = undefined;
    const _m = this.middleware.getMiddle();
    let m = [..._m];
    if(fv){
      const { middleware, handler, paramsName, params } = fv;
      if(paramsName){
        request.params = {[paramsName]: params} as ReqObjectField;
      }
      fn = handler;
      m = [...m, ...middleware];
    }
    await this.request.parseBody(request);
    response.redirect = response.redirect.bind(globalThis, response);
    response.render = response.render.bind(globalThis, response);
    const f = this.#composeMiddle(m, request, response, fn);
    await f.call(globalThis);
    response.send(request, response);
  }

  #composeMiddle = (middleware: Function[], request: Req, response: Res, execFunc: Function | undefined) => {
    if (!Array.isArray(middleware)) throw new TypeError('Middleware must be an array!')
    return async function () {
      // last called middleware #
      let index = -1
      return dispatch(0)
      async function dispatch (i: number): Promise<any> {
        if (i <= index) return Promise.reject(new Error('next() called multiple times'))
        index = i
        let fn: Function | undefined = middleware[i]
        if (i === middleware.length){
          fn = execFunc
          response.status = execFunc ? Status.OK : Status.NotFound;
        }
        try {
          return fn && fn(request, response, dispatch.bind(null, index + 1));
        } catch (err) {
          return Promise.reject(err)
        }
      }
    }
  }

  add(
    method: string,
    url: string,
    handler: Function,
    middleware: Function[] = [],
  ) {
    const p = this.#tree[method.toLowerCase()];
    const i = url.lastIndexOf(":");
    if (i >= 0) {
      const { url: u = '/', paramsName } = parseParamsName(url, i);
      const v = p[u];
      p[u] = {
        ...v,
        paramsName,
        dynamicHandler: handler,
        dynamicMiddleware: middleware,
      };
      return;
    }
    p[url] = {
      ...p[url],
      handler,
      middleware,
    };
  }

  #getParamsRoute = (m: Record<string, MethodMapValue>, url: string) => {
    const { url: u, params } = parseParamsValue(url);
    const _v = m[u];
    if (_v) {
      const { dynamicHandler, dynamicMiddleware, paramsName } = _v;
      return {
        handler: dynamicHandler as Function,
        middleware: dynamicMiddleware as Function[],
        paramsName,
        params,
      };
    }
    return null;
  };

  find(method: string, url: string): MethodMapValue | null {
    const m = this.#tree[method];
    const v = m[url];
    if (v) {
      const { handler, middleware } = v;
      if (handler) {
        return {
          handler,
          middleware,
        };
      }
      return this.#getParamsRoute(m, url);
    }
    return this.#getParamsRoute(m, url);
  }

  get(url: string, handler: Function, middleware: Function[]) {
    this.add("get", url, handler, middleware);
  }

  post(url: string, handler: Function, middleware: Function[]) {
    this.add("post", url, handler, middleware);
  }

  put(url: string, handler: Function, middleware: Function[]) {
    this.add("put", url, handler, middleware);
  }

  delete(url: string, handler: Function, middleware: Function[]) {
    this.add("delete", url, handler, middleware);
  }

  options(url: string, handler: Function, middleware: Function[]) {
    this.add("options", url, handler, middleware);
  }

  head(url: string, handler: Function, middleware: Function[]) {
    this.add("head", url, handler, middleware);
  }

  connect(url: string, handler: Function, middleware: Function[]) {
    this.add("connect", url, handler, middleware);
  }

  trace(url: string, handler: Function, middleware: Function[]) {
    this.add("trace", url, handler, middleware);
  }

  patch(url: string, handler: Function, middleware: Function[]) {
    this.add("patch", url, handler, middleware);
  }

}
