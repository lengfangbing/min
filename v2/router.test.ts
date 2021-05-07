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

// findInLoop的类型
type FindInLoop = (
  urls?: Array<string>,
  map?: Record<string, Min.RouteOptions>,
) => {
  handler: Min.HandlerFunc;
  middleware?: Min.MiddlewareFunc[];
  dynamicValues?: Record<string, string>;
  exec?: string[];
} | undefined;

export class Router {
  #tree: Min.RouterTree;

  constructor() {
    this.#tree = INIT_ROUTER_TREE;
  }

  // 回溯查找的方法
  #backtrackingFindLoop = (func: Array<NonNullable<FindInLoop>>) => {
    for (let i = func.length - 1; i >= 0; i--) {
      const res = func[i]();
      if (res !== void 0) {
        return res;
      }
    }
    return void 0;
  };

  // 根据提供的map和分割的url数组进行递归查找
  #findInLoop: FindInLoop = (
    urls?: Array<string>,
    map?: Record<string, Min.RouteOptions>,
  ) => {
    if (urls === void 0 || map === void 0) {
      return void 0;
    }
    // 查找遵循静态路由优先, 动态路由次之, 全局路由最后的规则
    // 用变量保存下变化的map
    let routeMap = map;
    // 用变量保存下得到的RouteOptons
    let findRouteOptions: Min.RouteOptions | undefined = void 0;
    // 数组保存动态路由和全局路由所有可能的链路, 因为要深度优先, 所以遍历两者从后往前遍历
    // 动态路由保存的执行方法
    const dynamicFuncs: Array<FindInLoop> = [];
    // 全局路由保存的执行方法
    const globalFuncs: Array<FindInLoop> = [];
    // 是否需要回溯查找动态路由和全局路由
    let needBacktracking = false;
    // 遍历urls进行查找
    for (let i = 0; i < urls.length; i++) {
      const findKey = urls[i];
      // 静态路由查找项
      const singleRouteOptions = routeMap[findKey];
      // 动态路由查找项
      const dynamicRouteOptions = routeMap[DYNAMIC_ROUTER_TREE_KEY];
      // 全局路由查找项
      const globalRouteOptions = routeMap[GLOBAL_ROUTER_TREE_KEY];
      // 如果查到了动态查找项
      if (dynamicRouteOptions) {
        dynamicFuncs.push(
          this.#findInLoop.bind(this, urls.slice(i), {
            [DYNAMIC_ROUTER_TREE_KEY]: dynamicRouteOptions,
          }),
        );
      }
      // 如果查到了全局查找项
      if (globalRouteOptions) {
        globalFuncs.push(
          this.#findInLoop.bind(this, urls.slice(i), {
            [GLOBAL_ROUTER_TREE_KEY]: globalRouteOptions,
          }),
        );
      }
      // 判断是否查到了静态查找项
      if (singleRouteOptions) {
        // 如果查到了静态查找项, 赋值value
        findRouteOptions = singleRouteOptions;
        // 如果不是最后一次匹配, 则修改routeMap指向下一个next
        if (i !== urls.length - 1) {
          if (singleRouteOptions.next === void 0) {
            // 如果没有next, 并且当前不是最后一次查找, 那么break掉, 进行回溯查找
            needBacktracking = true;
            break;
          } else {
            // 如果有next, 因为这不是最后一次匹配, 所以把routeMap指向next进行下一次查找
            routeMap = singleRouteOptions.next;
          }
        } else {
          // 如果是最后一次匹配, 因为前面已经赋值过value, 所以不需要什么操作
        }
      } else if (dynamicRouteOptions) {
        // 如果没查到静态路由但是查到了动态路由
        findRouteOptions = dynamicRouteOptions;
        // 如果不是最后一次匹配, 则修改routeMap指向下一个next
        if (i !== urls.length - 1) {
          if (dynamicRouteOptions.next === void 0) {
            // 如果没有next, 并且当前不是最后一次查找, 那么break掉, 进行回溯查找
            needBacktracking = true;
            break;
          } else {
            // 如果有next, 因为这不是最后一次匹配, 所以把routeMap指向next进行下一次查找
            routeMap = dynamicRouteOptions.next;
          }
        } else {
          // 如果是最后一次匹配, 因为前面已经赋值过value, 所以不需要什么操作
        }
      } else if (globalRouteOptions) {
        // 如果没查到静态路由也没有查到动态路由但是查到了全局路由
        findRouteOptions = globalRouteOptions;
        // 如果不是最后一次匹配, 则修改routeMap指向下一个next
        if (i !== urls.length - 1) {
          if (globalRouteOptions.next === void 0) {
            // 如果没有next, 并且当前不是最后一次查找, 那么break掉, 进行回溯查找
            needBacktracking = true;
            break;
          } else {
            // 如果有next, 因为这不是最后一次匹配, 所以把routeMap指向next进行下一次查找
            routeMap = globalRouteOptions.next;
          }
        } else {
          // 如果是最后一次匹配, 因为前面已经赋值过value, 所以不需要什么操作
        }
      } else {
        // 如果这一次查找三者都没找到, 那么break掉, 进行回溯查找
        // 如果没找到静态查找项, 则需要回溯查找, break掉去走后面的逻辑
        needBacktracking = true;
        break;
      }
    }
    // 如果needBacktracking是true, 表示在之前查找中发生了next为void 0的情况, 则直接进行回溯查找即可
    if (needBacktracking) {
      // 如果需要回溯查找但是回溯查找的两个数组都是空, 则表示不可能有匹配项, 直接返回void 0
      if (dynamicFuncs.length === 0 && globalFuncs.length === 0) {
        return void 0;
      }
      // 先回溯查找动态路由
      const dynamicFindRouteOptions = this.#backtrackingFindLoop(dynamicFuncs);
      if (dynamicFindRouteOptions !== void 0) {
        // 如果查到了动态路由的匹配项, 那么直接返回了
        return dynamicFindRouteOptions;
      }
      // 没查到动态路由, 查找全局路由
      const globalFindRouteOptions = this.#backtrackingFindLoop(globalFuncs);
      if (globalFindRouteOptions) {
        // 如果查到了全局路由的匹配项, 那么直接返回了
        return globalFindRouteOptions;
      }
    } else {
      // 如果不需要回溯查找, 那么查看找到的findRouteOptions指向的是否是注册过的路由
      if (findRouteOptions !== void 0) {
        // 如果指向的不是空
        if (findRouteOptions.handler !== void 0) {
          // 如果有注册过的方法, 那么表示这个RouteOptions是注册过的路由, 直接返回
          return findRouteOptions as Omit<Min.RouteOptions, 'handler'> & Pick<NonNullable<ReturnType<FindInLoop>>, 'handler'>;
        } else {
          // 如果没有注册过的方法, 则表示这个路由是没有注册过的, 直接返回void 0就行
          return void 0;
        }
      } else {
        // 如果指向的是空, 表示没有找到相应的注册过的路由, 那么返回void 0就行
        return void 0;
      }
    }
    // 如果回溯查找也是void 0, 则会走到这一步, 表示没有符合的一项, 所以直接返回void 0
    return void 0;
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
      if (findResult === void 0) {
        return null;
      }
      // 如果查到了数据, 则进行进一步的处理
      return findResult;
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
              { handler, middleware, dynamicValues },
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
function globalAndDynamicTestV1() {}
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
  "/api/test/*static",
  globalTestV1,
  [globalTestV1Middleware],
);
router.add(
  "get",
  "/api/:test/*static",
  globalAndDynamicTestV1,
);

const findSingle = router.find(
  "/api/test/v1/?name=冷方冰&age=23&love=王敏&love=可乐&love=奶茶",
  "get",
);
