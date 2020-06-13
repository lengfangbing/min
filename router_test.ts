import {
  parseParamsName,
  parseParamsValue,
} from "./utils/url/url.ts";
import {
  MethodMapValue
} from './model.ts';

export class _Router {
  #tree: Record<string, Record<string, MethodMapValue>>;

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
  }

  add(
    method: string,
    url: string,
    handler: Function,
    middleware: Function[] = [],
  ) {
    // 该method所有请求映射
    const p = this.#tree[method.toLowerCase()];
    // 动态路由:的索引
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
    // 该method所有请求映射
    const m = this.#tree[method];
    // 该url对应的值
    const v = m[url];
    // 静态路由优先匹配
    if (v) {
      const { handler, middleware } = v;
      if (handler) {
        return {
          handler,
          middleware,
        };
      }
      // 可能是动态路由, 去匹配动态路由
      return this.#getParamsRoute(m, url);
    }
    // 匹配动态路由
    return this.#getParamsRoute(m, url);
  }

  get(url: string, handler: Function, middleware: Function[]) {
    this.add("get", url, handler, middleware);
  }

  post(url: string, handler: Function, middleware: Function[]) {
    this.add("post", url, handler, middleware);
  }
  getTree() {
    return this.#tree;
  }
}

const router = new _Router();
router.get("/getList", () => {
  console.log("get /getList");
}, []);
router.get("/getList/:id", () => {
  console.log("get /getList/:id");
}, []);
router.get("/:id", () => {
  console.log("get /:id");
}, []);
router.get("/info/:userId", () => {
  console.log("post /info/:userId");
}, []);
router.get("/", () => {
  console.log("get /");
}, []);
router.get("/info/2016207235", () => {
  console.log("get /info/2016207235");
}, []);
router.post("/info/2016207235", () => {
  console.log("post /info/2016207235");
}, []);

const time1 = performance.now();
const a = router.find("get", "/name");
const time2 = performance.now();

console.log(time2 - time1);

console.log(a);

a?.handler.call(this);
