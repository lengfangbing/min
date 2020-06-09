import {
  ServerRequest,
  Status
} from "./deps.ts";
import {
  Req,
  ReqMethod,
  ReqObjectField,
  Res
} from "./http.ts";
import {
  Middleware
} from "./middleware.ts";
import {
  parseDynamicPath,
  parseUrl,
  parseUrlQuery
} from "./utils/url/url.ts";
import {
  MethodMapValue
} from './model.ts';
import {
  Request
} from "./request.ts";
import {
  Response
} from "./response.ts";

export class Router {

  // 采用Record的结构进行增加动态路由匹配( 数据量大时键值对速度大于Map, 而且Map占很大内存 )
  // get: { func: Function, paramsName?: string,
  // dynamicFunc?: Function, middleWare: Array || null }
  #tree: Record<string, Record<string, MethodMapValue>> = {
    get: {},
    post: {},
    put: {},
    delete: {},
    options: {},
    head: {},
    connect: {},
    trace: {},
    patch: {}
  }
  middleware: Middleware
  request: Request
  response: Response

  constructor() {
    this.middleware = new Middleware();
    this.request = new Request();
    this.response = new Response();
  }

  #handleParams = (funcMap: Record<string, MethodMapValue>, request: Req): {handler: Function, middleware: Function[]} | null => {
    const {url: dynamicUrl, params} = parseUrl(request.url);
    const funcValue = funcMap[dynamicUrl] as MethodMapValue;
    if (funcValue) {
      const {paramsName, dynamicFunc, middleware} = funcValue;
      if (paramsName) {
        if (dynamicFunc && params) {
          request.params = {[paramsName]: params};
          return {
            handler: dynamicFunc,
            middleware
          };
        }
      }
    }
    return null;
  }

  #handleRequest = async (request: Req, response: Res) => {
    // 处理query
    this.request.parseUrlAndQuery(request);
    const funcMap: Record<string, MethodMapValue> = this.#getRouteByMethod(request.method.toLowerCase());
    // 取出method对应的方法路由对象, 然后先匹配静态路由, 没有的话再去匹配动态路由
    // 后期修改的话就修改这里
    let funcValue: MethodMapValue = funcMap[request.url || '/'] as MethodMapValue;
    // 取出路由单独的中间件
    let ownMiddleware: Function[];
    let execFunc: Function | null;
    // await this.#handleRequestBody(request);
    await this.request.parseBody(request);
    // 处理body
    // 优先匹配静态方法
    if (funcValue) {
      const {func} = funcValue;
      execFunc = func || null;
      ownMiddleware = funcValue.middleware;
    }else{
      // 再去匹配动态路由
      // 动态路由才会去处理params
      const middles = this.#handleParams(funcMap, request) as {handler: Function, middleware: Function[]} | null;
      execFunc = middles ? middles.handler : null;
      ownMiddleware = middles ? middles.middleware : [];
    }
    // 处理中间件, 在中间件最后处理请求request
    const middleware = this.middleware.getMiddle();
    // 设置redirect方法
    response.redirect = response.redirect.bind(globalThis, response);
    // 设置render方法
    response.render = response.render.bind(globalThis, response);
    const middleProxy = middleware.concat(ownMiddleware);
    // 取出中间件的下一个方法
    const func = this.#composeMiddle(middleProxy, request, response, execFunc);
    await func.call(globalThis);
    response.send(request, response);
  }

  #composeMiddle = (middleware: Function[], request: Req, response: Res, execFunc: Function | null) => {
    if (!Array.isArray(middleware)) throw new TypeError('Middleware must be an array!')
    return async function () {
      // last called middleware #
      let index = -1
      return dispatch(0)
      async function dispatch (i: number): Promise<any> {
        if (i <= index) return Promise.reject(new Error('next() called multiple times'))
        index = i
        let fn: Function | null = middleware[i]
        if (i === middleware.length){
          fn = execFunc
          response.status = execFunc ? Status.OK : Status.NotFound;
        }
        try {
          return fn && fn(request, response, dispatch.bind(null, index + 1));
        } catch (err) {
          return Promise.reject(err)
        }
      }
    }
  }

  #add = (method: ReqMethod, url: string, handler: Function, middleware: Function[]) => {
    // 获取该方法节点
    const parentNode = this.#getTree()[method.toLowerCase()];
    // 设置动态路由Map
    if (url.split('/:').length > 1) {
      const parseParams = parseDynamicPath(url);
      const {url: realUrl, paramsName} = parseParams;
      // 重新设置这个url对应的参数和方法
      parentNode[realUrl] = {
        ...parentNode[realUrl],
        paramsName,
        dynamicFunc: handler,
        middleware
      } as MethodMapValue;
      return;
    }
    parentNode[url] = {...parentNode[url], func: handler, middleware} as MethodMapValue;
  }

  get(url: string, handler: Function, middleware: Function[]) {
    this.#add('get', url, handler, middleware);
  }

  post(url: string, handler: Function, middleware: Function[]) {
    this.#add('post', url, handler, middleware);
  }

  put(url: string, handler: Function, middleware: Function[]) {
    this.#add('put', url, handler, middleware);
  }

  delete(url: string, handler: Function, middleware: Function[]) {
    this.#add('delete', url, handler, middleware);
  }

  options(url: string, handler: Function, middleware: Function[]) {
    this.#add('options', url, handler, middleware);
  }

  head(url: string, handler: Function, middleware: Function[]) {
    this.#add('head', url, handler, middleware);
  }

  connect(url: string, handler: Function, middleware: Function[]) {
    this.#add('connect', url, handler, middleware);
  }

  trace(url: string, handler: Function, middleware: Function[]) {
    this.#add('trace', url, handler, middleware);
  }

  patch(url: string, handler: Function, middleware: Function[]) {
    this.#add('patch', url, handler, middleware);
  }

  #getTree = () => {
    return this.#tree;
  }

  #getRouteByMethod = (method: string) => {
    return this.#getTree()[method] || {}
  }

  async handleRoute(request: ServerRequest) {
    // 处理req, res
    const req: Req = Request.createRequest({
      url: request.url,
      method: request.method as ReqMethod,
      headers: request.headers,
      request
    });
    const res: Res = Response.createResponse();
    await this.#handleRequest(req, res);
  }
}

