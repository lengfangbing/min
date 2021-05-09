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
} as Min.Router.Tree;

export class Router implements Min.Router.Router {
  private tree: Min.Router.Tree;

  constructor() {
    this.tree = INIT_ROUTER_TREE;
  }

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
    let index = 0;
    for (const [k, v] of Object.entries(values)) {
      index++;
      const numberIndex = Number(k);
      if (index === count) {
        if (isGlobal) {
          res[v] = uri.slice(numberIndex).join('/');
          continue;
        }
      }
      res[v] = uri[numberIndex];
    }
    return res;
  };

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

  private findInLoop: Min.Router.FindInLoop = (
    urls?: Array<string>,
    map?: Record<string, Min.Router.ItemOptions>,
  ) => {
    if (urls === void 0 || map === void 0) {
      return void 0;
    }
    let routeMap = map;
    let findRouteOptions: undefined | Min.Router.ItemOptions = void 0;
    const backtrackingFunc: Array<{ urls: typeof urls; map: typeof map }> = [];
    let needBacktracking = false;
    let i = 0;
    for (; i < urls.length; i++) {
      const findKey = urls[i];
      const singleRouteOptions = routeMap[findKey];
      const dynamicRouteOptions = routeMap[DYNAMIC_ROUTER_TREE_KEY];
      const globalRouteOptions = routeMap[GLOBAL_ROUTER_TREE_KEY];
      if (singleRouteOptions) {
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
        if (singleRouteOptions.next !== void 0) {
          routeMap = singleRouteOptions.next;
        } else {
          needBacktracking = true;
          break;
        }
      } else if (dynamicRouteOptions) {
        findRouteOptions = dynamicRouteOptions;
        if (globalRouteOptions) {
          backtrackingFunc.push({
            urls: urls.slice(i),
            map: { [GLOBAL_ROUTER_TREE_KEY]: globalRouteOptions },
          });
        }
        if (dynamicRouteOptions.next !== void 0) {
          routeMap = dynamicRouteOptions.next;
        } else {
          needBacktracking = true;
          break;
        }
      } else if (globalRouteOptions) {
        findRouteOptions = globalRouteOptions;
        needBacktracking = false;
        break;
      }
    }
    if (needBacktracking && i !== urls.length - 1) {
      if (backtrackingFunc.length === 0) {
        return void 0;
      }
      const backtrackingRouteOptions = this.backtrackingFindLoop(
        backtrackingFunc,
      );
      if (backtrackingRouteOptions !== void 0) {
        return backtrackingRouteOptions;
      }
    } else {
      if (findRouteOptions !== void 0) {
        if (findRouteOptions.handler !== void 0) {
          return findRouteOptions as NonNullable<ReturnType<Min.Router.FindInLoop>>;
        } else {
          return void 0;
        }
      } else {
        return void 0;
      }
    }
    return void 0;
  };

  find(uri: string, method: string) {
    const targetRouteOptionsRoot = this.tree[method.toLowerCase()];
    if (targetRouteOptionsRoot) {
      const { uri: requestUri, query } = parseUriAndQuery(uri);
      const routerFindUri = requestUri.slice(1).split("/");
      const findResult = this.findInLoop(
        routerFindUri,
        targetRouteOptionsRoot,
      );
      if (findResult === void 0) {
        return null;
      }
      const { handler, middleware = [], paramsValue, exec = [], isGlobal, paramsCount } = findResult;
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
    return null;
  }

  private updateTreeNode4AddOrReplace = (
    key: string,
    newTreeNode: Record<string, Min.Router.ItemOptions>,
    isLastRouteSlice?: boolean,
    otherOptions?: Partial<Min.Router.ItemOptions>,
  ) => {
    if (newTreeNode[key]) {
      if (isLastRouteSlice) {
        newTreeNode[key] = {
          ...newTreeNode[key],
          ...otherOptions,
        };
        return { replace: false, value: void 0 };
      } else {
        return { replace: true, value: newTreeNode[key].next };
      }
    } else {
      if (isLastRouteSlice) {
        newTreeNode[key] = {
          ...otherOptions,
        };
        return { replace: false, value: void 0 };
      } else {
        newTreeNode[key] = {
          next: {},
        };
        return { replace: true, value: newTreeNode[key].next };
      }
    }
  };

  add(
    method: string,
    uri: string,
    handler?: Min.Router.HandlerFunc,
    middleware?: Array<Min.Router.MiddlewareFunc>,
  ) {
    const realMethod = method.toLowerCase();
    const parsedUri = parseRouteUri(uri, true);
    const tree = this.tree;
    let treeNode = tree[realMethod];
    let paramsValue: Min.Router.ItemOptions["paramsValue"] = void 0;
    let paramsCount = 0;
    parsedUri.forEach((item, index) => {
      if (item === DYNAMIC_ROUTER_TREE_KEY || item === GLOBAL_ROUTER_TREE_KEY) {
        throw new Error(
          `dont add '${DYNAMIC_ROUTER_TREE_KEY}' or '${GLOBAL_ROUTER_TREE_KEY}' as a part of route path, use other instead!`,
        );
      }
      if (treeNode) {
        if (typeof item === "string") {
          const { replace, value } = this.updateTreeNode4AddOrReplace(
            item,
            treeNode,
            index === parsedUri.length - 1,
            { handler, middleware, paramsValue },
          );
          if (replace && value) {
            treeNode = value;
          }
        } else {
          const { type, paramName } = item;
          if (type === "dynamic") {
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
            if (replace && value) {
              treeNode = value;
            }
          } else {
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
            if (replace && value) {
              treeNode = value;
            }
          }
        }
      } else {
        throw new Error(
          `${method} is not supported, occured during adding ${uri} route, if you still have questions, please open an issue, :)`,
        );
      }
    });
  }
}