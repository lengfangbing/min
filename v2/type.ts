export declare namespace Min {
  // 路由类型. Router's namespace
  namespace Router {
    // 路由树. route tree
    type Tree = {
      get: Record<string, ItemOptions>;
      post: Record<string, ItemOptions>;
      put: Record<string, ItemOptions>;
      delete: Record<string, ItemOptions>;
      options: Record<string, ItemOptions>;
      head: Record<string, ItemOptions>;
      connect: Record<string, ItemOptions>;
      trace: Record<string, ItemOptions>;
      patch: Record<string, ItemOptions>;
      // 对于不支持的路由, 直接忽略掉即可, 加上这个类型是为了方便动态查找
      [key: string]: Record<string, ItemOptions> | undefined;
    };
    // 每一段路由uri的值. every slice route options in router
    type ItemOptions = {
      // 当前节点的下一节点. the next tree node under this tree node
      next?: Record<string, ItemOptions>;
      // 处理方法. the handler for this match route
      handler?: HandlerFunc;
      // 当前节点的中间件. the middleware function for this match route
      middleware?: Array<MiddlewareFunc>;
      // 动态路由和全局路由的kv, key是第几位, v是注册路由时的value. dynamic and global route [key: string]: value, key is index
      paramsValue?: Record<string, string>;
      // 动态路由和全局路由值的个数. dynamic and global route values count
      paramsCount?: number;
      // 手动处理装饰器的调用顺序和值. use for decorator, save the execution expression
      exec?: Array<string>;
      // 是否是全局路由. whether is global route
      isGlobal?: boolean;
    };
    // 匹配到路由的处理方法. handler function's type
    type HandlerFunc = (...args: Array<unknown>) => Promise<void> | void;
    // 中间件的处理方法. middlewares' functions' type
    type MiddlewareFunc = (...args: Array<unknown>) => Promise<void> | void;
    // 递归查找方法的类型. define recursion find function type
    type FindInLoop = (
      urls?: Array<string>,
      map?: Record<string, Min.Router.ItemOptions>,
    ) =>
      | (
        & Omit<Min.Router.ItemOptions, "handler">
        & { handler: Min.Router.HandlerFunc }
      )
      | undefined;
    // 查找的返回数据类型. define find function type is exists route
    type FindResult = {
      query: Record<string, unknown>;
      url: string;
      params: Record<string, string>;
      middleware: Min.Router.MiddlewareFunc[];
      handler: Min.Router.HandlerFunc;
      exec: string[];
    };
    // Router的对外暴露的类型定义. define class Router properties type
    class Router {
      /**
       * 添加路由的方法. method to add route
       * @param {string} method 添加的方法类型. route method
       * @param {string} uri 添加的uri. route uri
       * @param {Min.Router.HandlerFunc} [handler] 该路由的处理函数. route handler
       * @param {Array<Min.Router.MiddlewareFunc>} [middleware] 该路由的中间件. route middleware 
       */
      add(method: string, uri: string, handler?: Min.Router.HandlerFunc, middleware?: Array<Min.Router.MiddlewareFunc>): void;
      /**
       * 查找路由的方法. method to find route
       * @param {string} uri 要查找的uri. target uri
       * @param {string} method 要查找的请求方法类型. target method
       * @returns {FindResult | null} 返回的数据类型. 查不到返回null. return FindResult is exists, or null
       */
      find(uri: string, method: string): FindResult | null;
    }
  }

  // url解析类型. Parser's namespace
  namespace Parser {
    // 路由路径解析后的值. value parsed route uri
    type RouteUri = Array<
      | string
      | {
        type: RouteUriTypeStr;
        paramName: string;
      }
    >;
    // 路由路径解析复杂类型的类型. type parsed route uri to check this is a dynamic(:) route or global(*) route
    type RouteUriTypeStr = "dynamic" | "global";
  }
}