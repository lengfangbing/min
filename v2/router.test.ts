import type { Min } from "./type.ts";
import { parseRouteUri, parseUriAndQuery } from "./utils/parser.ts";
import {
  DYNAMIC_ROUTER_TREE_KEY,
  GLOBAL_ROUTER_TREE_KEY,
} from "./constants.ts";

const INIT_ROUTER_TREE = {
  get: {},
  post: {},
  put: {},
  delete: {},
  options: {},
  head: {},
  connect: {},
  trace: {},
  patch: {},
} as Min.RouterTree;

export class Router {
  #tree: Min.RouterTree;

  constructor() {
    this.#tree = INIT_ROUTER_TREE;
  }

  // 根据提供的map和分割的url数组进行递归查找
  #findInLoop = (
    urls: Array<string>,
    map: Record<string, Min.RouteOptions>,
  ) => {
    // 查找遵循静态路由优先, 动态路由次之, 全局路由最后的规则
    // 用变量保存下变化的map
    let routeMap = map;
    // 动态路由保存的执行方法
    const dynamicFuncs: Array<() => unknown> = [];
    // 全局路由保存的执行方法
    const globalFuncs: Array<() => unknown> = [];
    // 遍历urls进行查找
    for (let i = 0; i < urls.length; i++) {
      const findKey = urls[i];
      if (i === urls.length) {
        // 如果是最后一次查找
        // 如果有findKey这一项并且有handler, 说明这是要查找的静态路由
        // 直接把静态路由返回就行
        if (routeMap[findKey] && routeMap[findKey].handler) {
          return {
            handler: routeMap[findKey].handler as Min.HandlerFunc,
            middleware: routeMap[findKey].middleware,
            params: routeMap[findKey].dynamicValues,
            exec: routeMap[findKey].exec,
          }
        } else {
          // 如果没有findKey这一项或者没有对应的handler
          // 则说明静态路由不匹配, 需要查找动态路由和全局路由
          // @TODO: 可以保存下动态路由和全局路由的相关的urls和map, 然后这里递归执行.
          // 当然, 也可以想想有没有其他的好的实现方式
        }
      } else {
        // 如果不是最后一次查找
        // 动态修改routeMap指向找到的next
        // @TODO: 如果选择保存动态路由和全局路由相关的urls和map, 那么在这里需要手动保存到数组里面
      }
    }
  };

  // 根据uri, method在tree中进行查找, tree默认是内置只读的tree
  find(uri: string, method: string) {
    // 当前的目标一级RouteOptions
    const targetRouteOptionsRoot = this.#tree[method];
    // 如果options存在
    if (targetRouteOptionsRoot) {
      const { uri: requestUri, query } = parseUriAndQuery(uri);
      const routerFindUri = requestUri.slice(1).split("/");
      const findResult = this.#findInLoop(
        routerFindUri,
        targetRouteOptionsRoot,
      );
      console.log("要查找的uris: ", routerFindUri);
      console.log("请求的真实uri: ", requestUri);
      console.log("uri的query: ", query);
      console.log("递归查找的结果: ", findResult);
      // 如果查找到的时空, 则直接返回空
      if (findResult === null) {
        return null;
      }
      // 如果查到了数据, 则进行进一步的处理
      return 1;
    }
    // 如果method不存在, 直接返回null
    return null;
  }

  // 用来根据路由key动态增加新的路由或者修改传入的路由指向
  #updateTreeNode4AddOrReplace = (
    key: string,
    newTreeNode: Record<string, Min.RouteOptions>,
    isLastRouteSlice?: boolean,
    otherOptions?: Partial<Min.RouteOptions>,
  ) => {
    // 如果已经有了这一段uri, 则把treeNode指向这一段uri
    if (newTreeNode[key]) {
      // 需要判断是否是最后一段uri, 如果是最后一段, 则进行写操作, 执行结束
      if (isLastRouteSlice) {
        newTreeNode[key] = {
          ...newTreeNode[key],
          ...otherOptions,
        };
        return { replace: false, value: void 0 };
      } else {
        // 如果不是最后一段
        return { replace: true, value: newTreeNode[key].next };
      }
    } else {
      // 不存在这一段uri, 则定义这一段uri
      // next为初始空对象
      if (isLastRouteSlice) {
        // 如果是最后一段, 则把其他的配置项加上, 比如handler, middlewares, dynamicValues等
        newTreeNode[key] = {
          ...otherOptions,
        };
        return { replace: false, value: void 0 };
      } else {
        // 不是最后一段则只需要增加这个标识并指向下一段
        newTreeNode[key] = {
          next: {},
        };
        return { replace: true, value: newTreeNode[key].next };
      }
    }
  };

  // 方法类型; 路由uri, 处理方法, 中间件
  add(
    method: string,
    uri: string,
    handler?: Min.HandlerFunc,
    middleware?: Array<Min.MiddlewareFunc>,
  ) {
    // 将method进行忽略大小写操作
    const realMethod = method.toLowerCase();
    // 解析路由uri
    const parsedUri = parseRouteUri(uri, true);
    // 对tree进行动态增加
    const tree = this.#tree;
    // 动态拿到下一级的tree node进行操作
    let treeNode = tree[realMethod];
    // 将每一段的dynamicValue保存, 在增加操作的时候加上
    let dynamicValues: Min.RouteOptions["dynamicValues"] = void 0;
    // 遍历解析后的路由uri, 进行增加或替换(如果之前已经定义过这个路由的话)
    parsedUri.forEach((item, index) => {
      if (item === DYNAMIC_ROUTER_TREE_KEY || item === GLOBAL_ROUTER_TREE_KEY) {
        throw new Error(
          `dont add '${DYNAMIC_ROUTER_TREE_KEY}' or '${GLOBAL_ROUTER_TREE_KEY}' as a part of route path, use other instead!`,
        );
      }
      if (treeNode) {
        if (typeof item === "string") {
          // 如果是简单路由
          const { replace, value } = this.#updateTreeNode4AddOrReplace(
            item,
            treeNode,
            index === parsedUri.length - 1,
            { handler, middleware },
          );
          // 如果需要替换并且value有值
          if (replace && value) {
            treeNode = value;
          }
        } else {
          // 如果是动态路由或者全局路由
          const { type, paramName } = item;
          if (type === "dynamic") {
            // 如果是动态路由
            // 修改动态路由保存的值
            dynamicValues = {
              ...dynamicValues,
              [index]: paramName,
            };
            const { replace, value } = this.#updateTreeNode4AddOrReplace(
              DYNAMIC_ROUTER_TREE_KEY,
              treeNode,
              index === parsedUri.length - 1,
              { handler, middleware, dynamicValues },
            );
            // 如果需要替换并且value有值
            if (replace && value) {
              treeNode = value;
            }
          } else {
            // 如果是全局路由
            const { replace, value } = this.#updateTreeNode4AddOrReplace(
              GLOBAL_ROUTER_TREE_KEY,
              treeNode,
              index === parsedUri.length - 1,
              { handler, middleware },
            );
            // 如果需要替换并且value有值
            if (replace && value) {
              treeNode = value;
            }
          }
        }
      } else {
        // treeNode无效
        throw new Error(
          `${method} is not supported, occured during adding ${uri} route, if you still have questions, please open an issue, :)`,
        );
      }
    });
  }
}

/**
 * test case
 */
function singleTest() {}
function singleTestMiddleware() {}
function dynamicTestV1() {}
function dynamicTestV1Middleware() {}
function dynamicTestTest() {}
function dynamicTestTestMiddleware() {}
function globalTestV1() {}
function globalTestV1Middleware() {}
function dynamicTestTestAndV1() {}
function dynamicTestTestAndV1Middleware() {}

const router = new Router();
router.add(
  "get",
  "/api/test/v1",
  singleTest,
  [singleTestMiddleware],
);
router.add(
  "get",
  "/api/test/:v1",
  dynamicTestV1,
  [dynamicTestV1Middleware],
);
router.add(
  "get",
  "/api/:test/v1",
  dynamicTestTest,
  [dynamicTestTestMiddleware],
);
router.add(
  "get",
  "/api/:test/:v1",
  dynamicTestTestAndV1,
  [dynamicTestTestAndV1Middleware],
);
router.add(
  "get",
  "/api/test/*",
  globalTestV1,
  [globalTestV1Middleware],
);

const findSingle = router.find(
  "/api/test/v1/?name=冷方冰&age=23&love=王敏&love=可乐&love=奶茶",
  "get",
);
