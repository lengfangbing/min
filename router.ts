import { parseUrlQuery, splitPath, splitUrl } from "./utils/parse/url.ts";
import { Middleware } from "./middleware.ts";
import {
  HandlerFunc,
  MethodFuncArgument,
  NewRoute,
  RouteValue,
  SingleRoute,
} from "./model.ts";

export class Router {
  #tree: Record<string, Record<string, NewRoute>>;
  #initRoute: () => NewRoute;
  middleware: Middleware;

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
    this.#initRoute = () => ({
      next: null,
      handler: null,
      middleware: [],
      paramsNames: {},
    });
  }

  #forEachBackMap = (
    map: Array<() => SingleRoute | null>,
  ): SingleRoute | null => {
    for (let i = 0; i < map.length; i++) {
      const res = map[i]();
      if (res) {
        return res;
      }
    }
    return null;
  };

  add(
    method: string,
    url: string,
    handler: HandlerFunc,
    middleware: MethodFuncArgument = [],
  ) {
    const fM = this.#tree[method];
    const us = splitPath(url);
    if (!us.length) {
      throw new Error(
        "router.add first argument path is invalid, use /path instead",
      );
    }
    const pm: NewRoute["paramsNames"] = {};
    let p: NewRoute | null = null;
    us.forEach(
      (value: string | { key: string; paramsName: string }, index: number) => {
        if (typeof value === "string") {
          if (p) {
            if (p.next) {
              if (p.next[value]) {
                p = p.next[value];
              } else {
                p.next[value] = this.#initRoute();
                p = p.next[value];
              }
            } else {
              p.next = {
                [value]: this.#initRoute(),
              };
              p = p.next[value];
            }
          } else {
            if (fM[value]) {
              p = fM[value];
            } else {
              fM[value] = this.#initRoute();
              p = fM[value];
            }
          }
        } else {
          if (p === null) {
            if (fM[value.key]) {
              p = fM[value.key];
            } else {
              fM[value.key] = this.#initRoute();
              p = fM[value.key];
            }
            pm[index] = value.paramsName;
          } else {
            if (p.next) {
              if (p.next[value.key]) {
                p = p.next[value.key];
              } else {
                p.next[value.key] = this.#initRoute();
                p = p.next[value.key];
              }
              pm[index] = value.paramsName;
            } else {
              p.next = {
                [value.key]: this.#initRoute(),
              };
              p = p.next[value.key];
              pm[index] = value.paramsName;
            }
          }
        }
      },
    );
    if (p === null) {
      throw (`add route into Router got error during: ${url} - ${method}\n`);
    } else {
      p = p as NewRoute;
      p.middleware = middleware;
      p.handler = handler;
      p.paramsNames = pm;
    }
  }

  #findLoop = (
    map: Record<string, NewRoute | null>,
    urls: Array<string>,
  ): SingleRoute | null => {
    const _m: Array<() => SingleRoute | null> = [];
    let rV: NewRoute | null = null;
    let nF: boolean = false;
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const nN: Record<string, NewRoute | null> | null = rV ? rV.next : map;
      if (nN === null) {
        return this.#forEachBackMap(_m);
      }
      const sV: NewRoute | null = nN[url];
      const dV: NewRoute | null = nN[""];
      if (sV) {
        rV = sV;
        if (dV) {
          _m.push(this.#findLoop.bind(this, { "": dV }, urls.slice(i)));
        }
      } else {
        if (dV) {
          rV = dV;
        } else {
          nF = true;
          break;
        }
      }
    }
    if (rV) {
      const { handler, middleware, paramsNames } = rV;
      if (handler === null) {
        return this.#forEachBackMap(_m);
      } else {
        if (nF) {
          return this.#forEachBackMap(_m);
        }
        return {
          handler,
          middleware,
          paramsNames,
        };
      }
    }
    return null;
  };

  find(method: string, url: string): RouteValue | null {
    const { url: u, query } = parseUrlQuery(url);
    url = u || "/";
    const fM = this.#tree[method];
    const us = splitUrl(url) as string[];
    const res = this.#findLoop(fM, us);
    if (res === null) {
      return null;
    }
    const { paramsNames, middleware, handler } = res;
    const params: { [key: string]: string } = {};
    for (const i in paramsNames) {
      params[paramsNames[i]] = us[+i].substring(1);
    }
    return {
      url,
      query: query || {},
      params: params || {},
      middleware,
      handler,
    };
  }

  get(url: string, handler: HandlerFunc, middleware: MethodFuncArgument) {
    this.add("get", url, handler, middleware);
  }

  post(url: string, handler: HandlerFunc, middleware: MethodFuncArgument) {
    this.add("post", url, handler, middleware);
  }

  put(url: string, handler: HandlerFunc, middleware: MethodFuncArgument) {
    this.add("put", url, handler, middleware);
  }

  delete(url: string, handler: HandlerFunc, middleware: MethodFuncArgument) {
    this.add("delete", url, handler, middleware);
  }

  options(url: string, handler: HandlerFunc, middleware: MethodFuncArgument) {
    this.add("options", url, handler, middleware);
  }

  head(url: string, handler: HandlerFunc, middleware: MethodFuncArgument) {
    this.add("head", url, handler, middleware);
  }

  connect(url: string, handler: HandlerFunc, middleware: MethodFuncArgument) {
    this.add("connect", url, handler, middleware);
  }

  trace(url: string, handler: HandlerFunc, middleware: MethodFuncArgument) {
    this.add("trace", url, handler, middleware);
  }

  patch(url: string, handler: HandlerFunc, middleware: MethodFuncArgument) {
    this.add("patch", url, handler, middleware);
  }
}
