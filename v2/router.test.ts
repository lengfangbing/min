import type { Min } from "./type.ts";
import { colors } from "../deps.ts";
import { parseRouteUri } from "./utils/parser.ts";

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

// 动态路由的key
const DYNAMIC_ROUTER_TREE_KEY = "#";
// 全局路由的key
const GLOBAL_ROUTER_TREE_KEY = "";

export class Router {
  #tree: Min.RouterTree;

  constructor() {
    this.#tree = INIT_ROUTER_TREE;
  }

  // 根据uri, method在tree中进行查找, tree默认是内置只读的tree
  find(uri: string, method: string, tree?: Min.RouterTree) {
    // 找到当前的目标tree
    const targetTree = tree || this.#tree;
    // 找到当前的目标一级RouteOptions
    const targetRouteOptions = targetTree[method];
    // 如果options存在
    if (targetRouteOptions) {
      console.log(
        `正在查找method是${colors.white(`${method}`)}, uri是${
          colors.white(`${uri}`)
        }的路由`,
      );
    }
    // 如果method不存在, 直接返回null
    return null;
  }

  // 用来根据路由key动态增加新的路由或者修改传入的路由指向
  #resolveTreeNode2AddOrPoint = (
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
        newTreeNode = newTreeNode[key].next;
				return { replace: true, value: newTreeNode[key].next };
      }
    } else {
      // 不存在这一段uri, 则定义这一段uri
      // next为初始空对象
      if (isLastRouteSlice) {
        // 如果是最后一段, 则把其他的配置项加上, 比如handler, middlewares, dynamicValues等
        newTreeNode[key] = {
          next: {},
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
      if (treeNode) {
        if (typeof item === "string") {
          // 如果是简单路由
          const {replace, value} = this.#resolveTreeNode2AddOrPoint(
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
            const {replace, value} = this.#resolveTreeNode2AddOrPoint(
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
            const {replace, value} = this.#resolveTreeNode2AddOrPoint(
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
function singleTest () {}
function singleTestMiddleware() {}
function dynamicTestV1 () {}
function dynamicTestV1Middleware() {}
function dynamicTestTest() {}
function dynamicTestTestMiddleware() {}
function globalTestV1 () {}
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
