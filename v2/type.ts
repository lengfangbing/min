// 支持的路由类型, route method support
export enum RouteMethod {
	Get,
	Post,
	Put,
	Delete,
	Options,
	Head,
	Connect,
	Trace,
	Patch,
}
export declare namespace Min {
	// 路由树, route tree
	type RouterTree = {
		get: Record<string, RouteOptions>,
		post: Record<string, RouteOptions>,
		put: Record<string, RouteOptions>,
		delete: Record<string, RouteOptions>,
		options: Record<string, RouteOptions>,
		head: Record<string, RouteOptions>,
		connect: Record<string, RouteOptions>,
		trace: Record<string, RouteOptions>,
		patch: Record<string, RouteOptions>,
		// 对于不支持的路由, 直接忽略掉即可, 加上这个类型是为了方便动态查找
		[key: string]: Record<string, RouteOptions> | undefined;
	};
  // 每一段路由uri的值, every slice route options in router
	type RouteOptions = {
		// 当前节点的下一节点, the next tree node under this tree node
		next: Record<string, RouteOptions>;
		// 处理方法, the handler for this match route
		handler?: HandlerFunc;
		// 当前节点的中间件, the middleware function for this match route
		middleware?: Array<MiddlewareFunc>;
		// 动态路由的kv, key是第几位, v是注册路由时的value, dynamic routes [key: string]: value, key is index
		dynamicValues?: Record<string, string>;
		// 手动处理装饰器的调用顺序和值, use for decorator, save the execution expression
		exec?: Array<string>;
	};
	// 匹配到路由的处理方法, handler function's type
	type HandlerFunc = (...args: Array<unknown>) => Promise<void> | void;
	// 中间件的处理方法, middlewares' functions' type
	type MiddlewareFunc = (...args: Array<unknown>) => Promise<void> | void;

	// 路由路径解析后的值, value parsed route uri
	type ParsedRouteUri = Array<
	string
	| {
		type: ParsedRouteUriType;
		paramName: string;
	}>;
	// 路由路径解析复杂类型的类型, type parsed route uri to check this is a dynamic(:) route or global(*) route
	type ParsedRouteUriType = 'dynamic' | 'global';
}