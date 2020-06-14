import {
  parseParamsName,
  parseParamsValue,
} from "./utils/url/url.ts";
import {
  Middleware
} from "./middleware.ts";
import {
  MethodMapValue
} from './model.ts';

export class Router {
  #tree: Record<string, Record<string, MethodMapValue>>;
  middleware: Middleware

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
