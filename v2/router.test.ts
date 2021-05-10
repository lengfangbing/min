import type { Min } from "./type.ts";
import { parseRouteUri, parseUriAndQuery } from "./utils/parser.test.ts";
import {
  DYNAMIC_ROUTER_TREE_KEY,
  GLOBAL_ROUTER_TREE_KEY,
} from "./constants.ts";
import { assertEquals } from "./deps.ts";

const INIT_ROUTER_TREE = {
  GET: {},
  POST: {},
  PUT: {},
  DELETE: {},
  OPTIONS: {},
  PATCH: {},
} as Min.Router.Tree;

export class Router implements Min.Router.Router {
  private tree: Min.Router.Tree;

  constructor() {
    this.tree = INIT_ROUTER_TREE;
  }

  // 构造params的方法
  private format2Prams = ({
    uri,
    values,
    isGlobal,
    count,
  }: {
    uri: Array<string>,
    values: Min.Router.ItemOptions["paramsValue"],
    isGlobal: Min.Router.ItemOptions["isGlobal"],
    count: Min.Router.ItemOptions['paramsCount']
  }) => {
    const res: Record<string, string> = {};
    if (values === void 0) {
      return res;
    }
    // 当前处理的个数, 如果和count相等, 表示是处理的最后一个
    let index = 0;
    for (const [k, v] of Object.entries(values)) {
      index++;
      const numberIndex = Number(k);
      if (index === count) {
        // 表示是处理的最后一个数据, 判断是不是全局查找的, 如果是就把剩余的url给join'/'处理
        if (isGlobal) {
          res[v] = uri.slice(numberIndex).join('/');
          continue;
        }
      }
      res[v] = uri[numberIndex];
    }
    return res;
  };

  // 回溯查找的方法
  private backtrackingFindLoop = (
    func: Array<
      { urls?: Array<string>; map?: Record<string, Min.Router.ItemOptions> }
    >,
  ) => {
    for (let i = func.length - 1; i >= 0; i--) {
      const res = this.findInLoop(func[i]?.urls, func[i]?.map);
      if (res !== void 0) {
        return res;
      }
    }
    return void 0;
  };

  // 根据提供的map和分割的url数组进行递归查找
  private findInLoop: Min.Router.FindInLoop = (
    urls?: Array<string>,
    map?: Record<string, Min.Router.ItemOptions>,
  ) => {
    if (urls === void 0 || map === void 0) {
      return void 0;
    }
    // 查找遵循静态路由优先, 动态路由次之, 全局路由最后的规则
    // 用变量保存下变化的map
    let routeMap = map;
    // 用变量保存下得到的RouteOptons
    let findRouteOptions: undefined | Min.Router.ItemOptions = void 0;
    // 回溯的方法
    const backtrackingFunc: Array<{ urls: typeof urls; map: typeof map }> = [];
    // 是否需要回溯查找动态路由和全局路由
    let needBacktracking = false;
    // 遍历的当前索引
    let i = 0;
    // 遍历urls进行查找
    for (; i < urls.length; i++) {
      const findKey = urls[i];
      // 静态路由查找项
      const singleRouteOptions = routeMap[findKey];
      // 动态路由查找项
      const dynamicRouteOptions = routeMap[DYNAMIC_ROUTER_TREE_KEY];
      // 全局路由查找项
      const globalRouteOptions = routeMap[GLOBAL_ROUTER_TREE_KEY];
      // 这三种路由是互斥的, 但是有关系
      if (singleRouteOptions) {
        // 如果查到了静态路由, 赋值value然后查看是否有动态路由和全局路由
        findRouteOptions = singleRouteOptions;
        if (dynamicRouteOptions) {
          backtrackingFunc.push({
            urls: urls.slice(i),
            map: { [DYNAMIC_ROUTER_TREE_KEY]: dynamicRouteOptions },
          });
        }
        if (globalRouteOptions) {
          backtrackingFunc.push({
            urls: urls.slice(i),
            map: { [GLOBAL_ROUTER_TREE_KEY]: globalRouteOptions },
          });
        }
        // 如果存在下一个next, 就把routeMap指向这个next, 不存在则break掉进行回溯查找
        if (singleRouteOptions.next !== void 0) {
          routeMap = singleRouteOptions.next;
        } else {
          // 如果不存在next则break掉进行回溯查找, 这个不需要关心是不是最后一次遍历
          needBacktracking = true;
          break;
        }
      } else if (dynamicRouteOptions) {
        // 如果存在动态路由, 赋值value然后查看是否有全局路由
        findRouteOptions = dynamicRouteOptions;
        // 如果同时存在全局路由, 把参数放到全局路由中
        // eslint-disable-next-line max-depth
        if (globalRouteOptions) {
          backtrackingFunc.push({
            urls: urls.slice(i),
            map: { [GLOBAL_ROUTER_TREE_KEY]: globalRouteOptions },
          });
        }
        // 如果存在下一个next, 就把routeMap指向这个next, 不存在则break掉进行回溯查找
        if (dynamicRouteOptions.next !== void 0) {
          routeMap = dynamicRouteOptions.next;
        } else {
          // 如果不存在next则break掉进行回溯查找, 这个不需要关心是不是最后一次遍历
          needBacktracking = true;
          break;
        }
      } else if (globalRouteOptions) {
        // 如果存在全局路由, 这种情况是静态路由和动态路由都不存在的时候才会走到这一步
        // 直接赋值然后break就行, 因为不允许全局通配符*出现在中间, 只能是末尾
        // 所以这种情况是一定符合的
        findRouteOptions = globalRouteOptions;
        // 不需要回溯
        needBacktracking = false;
        break;
      }
    }
    // 如果needBacktracking是true并且i不是最后一次遍历, 表示在之前查找中发生了next为void 0的情况, 则直接进行回溯查找即可
    if (needBacktracking && i !== urls.length - 1) {
      // 如果需要回溯查找并且查找的数组都是空, 直接返回void 0
      if (backtrackingFunc.length === 0) {
        return void 0;
      }
      const backtrackingRouteOptions = this.backtrackingFindLoop(
        backtrackingFunc,
      );
      if (backtrackingRouteOptions !== void 0) {
        // 如果查到了回溯的匹配项
        return backtrackingRouteOptions;
      }
    } else {
      // 如果不需要回溯查找, 那么查看找到的findRouteOptions指向的是否是注册过的路由
      if (findRouteOptions !== void 0) {
        // 如果指向的不是空
        if (findRouteOptions.handler !== void 0) {
          // 如果有注册过的方法, 那么表示这个RouteOptions是注册过的路由, 直接返回
          // 这里已经保证handler不会是undefined了
          return findRouteOptions as NonNullable<ReturnType<Min.Router.FindInLoop>>;
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
  find(uri: string, method: Min.Router.Method) {
    // 当前的目标一级RouteOptions
    const targetRouteOptionsRoot = this.tree[method.toUpperCase()];
    // 如果options存在
    if (targetRouteOptionsRoot) {
      const { uri: requestUri, query } = parseUriAndQuery(uri);
      const routerFindUri = requestUri.slice(1).split("/");
      const findResult = this.findInLoop(
        routerFindUri,
        targetRouteOptionsRoot,
      );
      // console.log("要查找的uris: ", routerFindUri);
      // console.log("请求的真实uri: ", requestUri);
      // console.log("uri的query: ", query);
      // console.log("递归查找的结果: ", findResult);
      // 如果查找到的时空, 则直接返回空
      if (findResult === void 0) {
        return null;
      }
      const { handler, middleware = [], paramsValue, exec = [], isGlobal, paramsCount } = findResult;
      // 如果查到了数据, 则进行进一步的处理
      return {
        query,
        url: requestUri,
        params: this.format2Prams({
          uri: routerFindUri,
          values: paramsValue,
          count: paramsCount,
          isGlobal,
        }),
        middleware,
        handler,
        exec,
      };
    }
    // 如果method不存在, 直接返回null
    return null;
  }

  // 用来根据路由key动态增加新的路由或者修改传入的路由指向
  private updateTreeNode4AddOrReplace = (
    key: string,
    newTreeNode: Record<string, Min.Router.ItemOptions>,
    isLastRouteSlice?: boolean,
    otherOptions?: Partial<Min.Router.ItemOptions>,
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
    method: Min.Router.Method,
    uri: string,
    handler?: Min.Router.HandlerFunc,
    middleware?: Array<Min.Router.MiddlewareFunc>,
  ) {
    // 将method进行忽略大小写操作
    const realMethod = method.toUpperCase();
    // 解析路由uri
    const parsedUri = parseRouteUri(uri, true);
    // 对tree进行动态增加
    const tree = this.tree;
    // 动态拿到下一级的tree node进行操作
    let treeNode = tree[realMethod];
    // paramsValue, 在增加操作的时候加上
    let paramsValue: Min.Router.ItemOptions["paramsValue"] = void 0;
    // paramsValue的个数
    let paramsCount = 0;
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
          const { replace, value } = this.updateTreeNode4AddOrReplace(
            item,
            treeNode,
            index === parsedUri.length - 1,
            { handler, middleware, paramsValue },
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
            paramsValue = {
              ...paramsValue,
              [index]: paramName,
            };
            const { replace, value } = this.updateTreeNode4AddOrReplace(
              DYNAMIC_ROUTER_TREE_KEY,
              treeNode,
              index === parsedUri.length - 1,
              { handler, middleware, paramsValue, paramsCount: ++paramsCount },
            );
            // 如果需要替换并且value有值
            if (replace && value) {
              treeNode = value;
            }
          } else {
            // 如果是全局路由
            // 修改动态路由保存的值
            paramsValue = {
              ...paramsValue,
              [index]: paramName,
            };
            const { replace, value } = this.updateTreeNode4AddOrReplace(
              GLOBAL_ROUTER_TREE_KEY,
              treeNode,
              index === parsedUri.length - 1,
              {
                handler,
                middleware,
                paramsValue,
                isGlobal: true,
                paramsCount: ++paramsCount,
              },
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
function simpleTest() {}
function simpleTestMiddleware() {}
function dynamicTestV1() {}
function dynamicTestV1Middleware() {}
function dynamicTestTest() {}
function dynamicTestTestMiddleware() {}
function globalTestV1() {}
function globalTestV1Middleware() {}
function globalAndDynamicTestV1() {}
function dynamicTestTestAndV1() {}
function dynamicTestTestAndV1Middleware() {}
function testRoot() {}
function testOnlyTest() {}

const router = new Router();
router.add(
  "GET",
  "/api/test/v1",
  simpleTest,
  [simpleTestMiddleware],
);
router.add(
  "GET",
  "/api/test/:v1",
  dynamicTestV1,
  [dynamicTestV1Middleware],
);
router.add(
  "GET",
  "/api/:test/v1",
  dynamicTestTest,
  [dynamicTestTestMiddleware],
);
router.add(
  "GET",
  "/api/:test/:v1",
  dynamicTestTestAndV1,
  [dynamicTestTestAndV1Middleware],
);
router.add(
  "GET",
  "/api/test/*static",
  globalTestV1,
  [globalTestV1Middleware],
);
router.add(
  "GET",
  "/api/:test/*static",
  globalAndDynamicTestV1,
);
router.add(
  "GET",
  "/",
  testRoot,
);
router.add(
  "GET",
  "/api/test",
  testOnlyTest,
);

const onlyTestUri = "/api/test";
const rootUri = "/";
const simpleTestUri = "/api/test/v1?name=lfb&age=456";
const testV1Uri = "/api/test/v12431/?fruit=apple&fruit=banana&name=unknown";
const testTestUri = "/api/test1231/v1";
const testTestAndV1Uri = "/api/test123/v213";
const globalTestV1Uri = "/api/test/123/532";
const globalTestDynamicTestV1Uri = "/api/test123/647/658";
const errorTestUri = '/api';

const findGet = (uri: string) => router.find(uri, 'GET');

Deno.test({
  name: 'testRoot',
  fn() {
    assertEquals(findGet(rootUri)?.handler, testRoot);
  }
});

Deno.test({
  name: 'testOnlyTest',
  fn() {
    assertEquals(findGet(onlyTestUri)?.handler, testOnlyTest);
  }
});

Deno.test({
  name: 'testSimple',
  fn() {
    assertEquals(findGet(simpleTestUri)?.handler, simpleTest);
  }
});

Deno.test({
  name: 'testSimpleQuery',
  fn() {
    assertEquals(findGet(simpleTestUri)?.query, { name: 'lfb', age: '456' });
  }
});

Deno.test({
  name: 'testDynamicV1',
  fn() {
    assertEquals(findGet(testV1Uri)?.handler, dynamicTestV1);
  }
});

Deno.test({
  name: 'testDynamicV1Params',
  fn() {
    assertEquals(findGet(testV1Uri)?.params, { v1: 'v12431' });
  }
});

Deno.test({
  name: 'testDynamicV1Query',
  fn() {
    assertEquals(findGet(testV1Uri)?.query, { name: 'unknown', fruit: ['apple', 'banana'] });
  }
});

Deno.test({
  name: 'testDynamicTest',
  fn() {
    assertEquals(findGet(testTestUri)?.handler, dynamicTestTest);
  }
});

Deno.test({
  name: 'testDynamicTestParams',
  fn() {
    assertEquals(findGet(testTestUri)?.params, { test: 'test1231' });
  }
});

Deno.test({
  name: 'testDynamicTestV1',
  fn() {
    assertEquals(findGet(testTestAndV1Uri)?.handler, dynamicTestTestAndV1);
  }
});

Deno.test({
  name: 'testDynamicTestV1Params',
  fn() {
    assertEquals(findGet(testTestAndV1Uri)?.params, { test: 'test123', v1: 'v213' });
  }
});

Deno.test({
  name: 'testGlobalV1',
  fn() {
    assertEquals(findGet(globalTestV1Uri)?.handler, globalTestV1);
  }
});

Deno.test({
  name: 'testDynamicTestGlobalV1',
  fn() {
    assertEquals(findGet(globalTestDynamicTestV1Uri)?.handler, globalAndDynamicTestV1);
  }
});

Deno.test({
  name: 'testDynamicTestGlobalV1Params',
  fn() {
    assertEquals(findGet(globalTestDynamicTestV1Uri)?.params, { test: 'test123', 'static': '647/658' });
  }
});

Deno.test({
  name: 'testError',
  fn() {
    assertEquals(findGet(errorTestUri), null);
  }
});