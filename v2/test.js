const DYNAMIC_ROUTER_TREE_KEY = '#';
const GLOBAL_ROUTER_TREE_KEY = '##';
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
};
const parseRouteUri = (uri, isRouteParse) => {
  let flagUri = String(uri);
  // 对uri进行前后的'/'删除
  while (flagUri.endsWith('/')) {
    flagUri = flagUri.slice(0, flagUri.length - 1);
  }
  while (flagUri.startsWith('/')) {
    flagUri = flagUri.slice(1);
  }
  const splitedUri = flagUri.split('/');
  // 如果不是路由uri解析, 是普通的请求uri解析
  if (!isRouteParse) {
    return splitedUri;
  }
  // 构造解析后的uri数组
  return splitedUri.reduce((prev, curr, _index, arr) => {
    if (prev.length === 0) {
      arr = [];
    }
    if (curr.startsWith('*')) {
      arr = [...prev, { type: 'global', paramName: curr.slice(1) }];
    } else if (curr.startsWith(':')) {
      arr = [...prev, { type: 'dynamic', paramName: curr.slice(1) }];
    } else {
      arr = [...prev, curr];
    }
    return arr;
  }, []);
};
class Router {
  #tree = void 0;

  constructor() {
    this.#tree = INIT_ROUTER_TREE;
  }
  // 回溯查找的方法
  #backtrackingFindLoop = func => {
    for (let i = func.length - 1; i >= 0; i--) {
      const res = this.#findInLoop(func[i].urls, func[i].map);
      if (res !== void 0) {
        return res;
      }
    }
    return void 0;
  };

  // 根据提供的map和分割的url数组进行递归查找
  // eslint-disable-next-line max-lines-per-function
  #findInLoop = (urls, map) => {
    if (urls === void 0 || map === void 0) {
      return void 0;
    }
    // 查找遵循静态路由优先, 动态路由次之, 全局路由最后的规则
    // 用变量保存下变化的map
    let routeMap = map;
    // 用变量保存下得到的RouteOptons
    let findRouteOptions = void 0;
    // 回溯的方法
    const backtrackingFunc = [];
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
      const backtrackingRouteOptions = this.#backtrackingFindLoop(backtrackingFunc);
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
          return findRouteOptions;
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
  find(uri, method) {
    console.time('a');
    // 当前的目标一级RouteOptions
    const targetRouteOptionsRoot = this.#tree[method];
    // 如果options存在
    if (targetRouteOptionsRoot) {
      const routerFindUri = uri.slice(1).split('/');
      const findResult = this.#findInLoop(routerFindUri, targetRouteOptionsRoot);
      // console.log('要查找的uris: ', routerFindUri);
      // console.log('请求的真实uri: ', uri);
      // console.log('uri的query: (fake)', {});
      console.log('递归查找的结果: ', findResult);
      // 如果查找到的时空, 则直接返回空
      if (findResult === void 0) {
        console.timeEnd('a');
        return null;
      }
      console.timeEnd('a');
      // 如果查到了数据, 则进行进一步的处理
      return findResult;
    }
    console.timeEnd('a');
    // 如果method不存在, 直接返回null
    return null;
  }
  // 用来根据路由key动态增加新的路由或者修改传入的路由指向
  #resolveTreeNode2AddOrPoint = (key, newTreeNode, isLastRouteSlice, otherOptions) => {
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
  add(method, uri, handler, middleware) {
    debugger;
    // 将method进行忽略大小写操作
    const realMethod = method.toLowerCase();
    // 解析路由uri
    const parsedUri = parseRouteUri(uri, true);
    // 对tree进行动态增加
    const tree = this.#tree;
    // 动态拿到下一级的tree node进行操作
    let treeNode = tree[realMethod];
    // 将每一段的dynamicValue保存, 在增加操作的时候加上
    let dynamicValues = void 0;
    // paramsValue的个数
    let paramsCount = 0;
    // 遍历解析后的路由uri, 进行增加或替换(如果之前已经定义过这个路由的话)
    parsedUri.forEach((item, index) => {
      if (treeNode) {
        if (typeof item === 'string') {
          // 如果是简单路由
          const { replace, value } = this.#resolveTreeNode2AddOrPoint(item, treeNode, index === parsedUri.length - 1, {
            handler,
            middleware,
            paramsCount,
            dynamicValues,
          });
          // 如果需要替换并且value有值
          if (replace && value) {
            treeNode = value;
          }
        } else {
          // 如果是动态路由或者全局路由
          const { type, paramName } = item;
          if (type === 'dynamic') {
            // 如果是动态路由
            // 修改动态路由保存的值
            dynamicValues = {
              ...dynamicValues,
              [index]: paramName,
            };
            const { replace, value } = this.#resolveTreeNode2AddOrPoint('#', treeNode, index === parsedUri.length - 1, {
              handler,
              middleware,
              dynamicValues,
              paramsCount: ++paramsCount
            });
            // 如果需要替换并且value有值
            // eslint-disable-next-line max-depth
            if (replace && value) {
              treeNode = value;
            }
          } else {
            // 如果是全局路由
            // 修改动态路由保存的值
            dynamicValues = {
              ...dynamicValues,
              [index]: paramName,
            };
            const { replace, value } = this.#resolveTreeNode2AddOrPoint(
              '##',
              treeNode,
              index === parsedUri.length - 1,
              { handler, middleware, dynamicValues, isGlobal: true, paramsCount: ++paramsCount },
            );
            // 如果需要替换并且value有值
            // eslint-disable-next-line max-depth
            if (replace && value) {
              treeNode = value;
            }
          }
        }
      } else {
        // treeNode无效
        throw new Error(
          // eslint-disable-next-line max-len
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
// router.add('get', '/api/test/v1', singleTest, [singleTestMiddleware]);
// router.add('get', '/api/test/:v1', dynamicTestV1, [dynamicTestV1Middleware]);
router.add('get', '/api/:test/v1', dynamicTestTest, [dynamicTestTestMiddleware]);
// router.add('get', '/api/:test/:v1', dynamicTestTestAndV1, [dynamicTestTestAndV1Middleware]);
// router.add('get', '/api/test/*static', globalTestV1, [globalTestV1Middleware]);
// router.add('get', '/api/:test/*static', globalAndDynamicTestV1);
// router.add('get', '/', function testRoot() {});
// router.add('get', '/api/test', function testOnlyTest() {});