import { parseUrlQuery, splitPath, splitUrl } from "./utils/test/url_test.ts";

import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

export interface RouteValue {
  query: Record<string, string>;
  url: string;
  params: Record<string, string>;
  handler: Function;
  middleware: Function[];
}

export interface SingleRoute {
  middleware: Function[];
  handler: Function;
  paramsNames: Record<string, string>;
}

export interface NewRoute {
  next: Record<string, NewRoute> | null;
  middleware: Function[];
  handler: Function | null;
  paramsNames: Record<string, string>;
}

export class Router {
  #tree: Record<string, Record<string, NewRoute>>;
  #initRoute: () => NewRoute;
  constructor() {
    this.#tree = {
      get: {},
      post: {},
      put: {},
      delete: {},
      options: {},
      head: {},
      patch: {},
    };
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

  #findLoop = (
    map: Record<string, NewRoute | null>,
    urls: string[],
  ): SingleRoute | null => {
    // 回溯查找的数组
    const _map: Array<() => SingleRoute | null> = [];
    // 当前查找到的静态处理Route
    let routeVal: NewRoute | null = null;
    // 是否需要回溯
    let needFallback: boolean = false;
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      // 下个节点对象
      const nextNode: any = routeVal ? routeVal.next : map;
      if (nextNode === null) {
        return this.#forEachBackMap(_map);
      }
      const stVal = nextNode[url];
      const dyVal = nextNode[""];
      // 静态匹配
      if (stVal) {
        routeVal = stVal;
        if (dyVal) {
          _map.push(this.#findLoop.bind(this, { "": dyVal }, urls.slice(i)));
        }
      } else {
        // 动态匹配
        if (dyVal) {
          routeVal = dyVal;
        } else {
          needFallback = true;
          break;
        }
      }
    }
    if (routeVal) {
      const { handler, middleware, paramsNames } = routeVal;
      if (handler === null) {
        return this.#forEachBackMap(_map);
      } else {
        if (needFallback) {
          return this.#forEachBackMap(_map);
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
    const funcMap = this.#tree[method];
    const urls = splitUrl(url) as string[];
    const res = this.#findLoop(funcMap, urls);
    if (res === null) {
      return null;
    }
    const { paramsNames, middleware, handler } = res;
    const params: { [key: string]: string } = {};
    for (const i in paramsNames) {
      params[paramsNames[i]] = urls[+i].substring(1);
    }
    return {
      url,
      query,
      params,
      middleware,
      handler,
    };
  }

  add(
    method: string,
    url: string,
    handler: Function,
    middleware: Function[] = [],
  ) {
    const funcMap = this.#tree[method];
    const urls = splitPath(url);
    if (!urls.length) {
      throw new Error(
        "router.add first argument path is invalid, use /path instead",
      );
    }
    const params: NewRoute["paramsNames"] = {};
    // p理解为一个查找路由这个数据结构的指针
    let p: NewRoute | null = null;
    urls.forEach(
      (value: string | { key: string; paramsName: string }, index: number) => {
        // 静态路由
        if (typeof value === "string") {
          // 如果p代表了有值了, 就代表funcMap有匹配项了
          if (p !== null) {
            // 如果p有next, 表示p有下一节点, 接下来判断是否有这个value节点
            if (p.next) {
              if (p.next[value]) {
                p = p.next[value];
              } else {
                p.next[value] = this.#initRoute();
                p = p.next[value];
              }
            } else {
              // 如果没有next, 表示没有下一节点, 这是个新节点
              p.next = {
                [value]: this.#initRoute(),
              };
              p = p.next[value];
            }
          } else {
            if (funcMap[value]) {
              p = funcMap[value];
            } else {
              funcMap[value] = this.#initRoute();
              p = funcMap[value];
            }
          }
        } else {
          // 动态路由
          // 把所有动态路由都改成''(空字符串)索引的形式构造树
          // 第一个就是动态路由
          if (p === null) {
            if (funcMap[value.key]) {
              p = funcMap[value.key];
            } else {
              funcMap[value.key] = this.#initRoute();
              p = funcMap[value.key];
            }
            params[index] = value.paramsName;
          } else {
            if (p.next) {
              if (p.next[value.key]) {
                p = p.next[value.key];
              } else {
                p.next[value.key] = this.#initRoute();
                p = p.next[value.key];
              }
              params[index] = value.paramsName;
            } else {
              p.next = {
                [value.key]: this.#initRoute(),
              };
              p = p.next[value.key];
              params[index] = value.paramsName;
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
      p.paramsNames = params;
    }
  }
}
console.log("you imported test module");
const router = new Router();
const path1 = "/name/:id/:version/detail";
const path2 = "/name/:da/:tt/ga";
const url = "/name/2016207235/v1/detail";

// test time used, remember with --allow-hrtime
function timeTest(func: Function) {
  const time1 = performance.now();
  func.call(null);
  const time2 = performance.now();
  console.log(time2 - time1);
}
// for example
timeTest(router.find.bind(router, "get", url));
router.add("get", path1, () => {
  console.log(path1);
});
router.add("get", path2, () => {
  console.log(path2);
});
assertEquals(
  { id: "100", version: "v1" },
  router.find("get", "/name/100/v1/detail/")?.params,
);
assertEquals(
  { da: "100", tt: "v1" },
  router.find("get", "/name/100/v1/ga/")?.params,
);
