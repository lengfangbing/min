import {
  serve,
  colors,
  join,
  serveTLS
} from './deps.ts';
import {
  Router
} from "./router.ts";
import {
  Req,
  Res,
  ReqMethod
} from "./http.ts";
import {
  Middleware
} from "./middleware.ts";
import {
  Request
} from "./request.ts";
import{
  Response,
  send
} from "./response.ts";
import {
  parseAddress
} from "./utils/application/application.ts";
import {
  AppConfig,
  RouteHandlers,
  RoutesConfig
} from "./model.ts";
import {
  cors
} from "./cors.ts";
import {
  assets
} from "./assets.ts";
// 读取better.config.js后调用#listen保存的参数
const appConfig: AppConfig = {
  server: {
    port: 80,
    hostname: '127.0.0.1'
  }
};

export class Application {
  #router: Router
  #middleware: Middleware
  constructor() {
    this.#router = new Router();
    this.#middleware = new Middleware();
  }

  #add = (method: ReqMethod, handlers: RouteHandlers) => {
    const { url, handler, middleware } = handlers;
    this.#router[method](url, handler, middleware || []);
  }

  use(func: Function){
    if(typeof func !== 'function') throw new Error('use function arguments must be a function type');
    this.#middleware.push(func);
    return this;
  }

  #setRoutes = async (routes: RoutesConfig[], cwd: string) => {
    for(let i = 0; i < routes.length; i++){
      const value = routes[i];
      const method: ReqMethod = value.method.toLowerCase() as ReqMethod;
      const { url, func, middleware = [] } = value;
      const handler =
        typeof func === 'string'
          ? (await import(join(cwd, func))).default
          : func;
      this.#add(method, {url, middleware, handler});
    }
  }

  // parse handler
  parseHandler(handlers: any[]): RouteHandlers{
    const url = handlers.shift();
    const handler = handlers.pop();
    const res = {
      url,
      handler
    } as RouteHandlers;
    if(handlers.length){
      res.middleware = handlers;
    }
    return res;
  }

  get(...args: any[]) {
    const funcHandler: RouteHandlers = this.parseHandler(args);
    this.#add('get', funcHandler);
  }

  post(...args: any[]) {
    const funcHandler: RouteHandlers = this.parseHandler(args);
    this.#add('post', funcHandler);
  }

  put(...args: any[]) {
    const funcHandler: RouteHandlers = this.parseHandler(args);
    this.#add('put', funcHandler);
  }

  delete(...args: any[]) {
    const funcHandler: RouteHandlers = this.parseHandler(args);
    this.#add('delete', funcHandler);
  }

  options(...args: any[]) {
    const funcHandler: RouteHandlers = this.parseHandler(args);
    this.#add('options', funcHandler);
  }

  head(...args: any[]) {
    const funcHandler: RouteHandlers = this.parseHandler(args);
    this.#add('head', funcHandler);
  }

  connect(...args: any[]) {
    const funcHandler: RouteHandlers = this.parseHandler(args);
    this.#add('connect', funcHandler);
  }

  trace(...args: any[]) {
    const funcHandler: RouteHandlers = this.parseHandler(args);
    this.#add('trace', funcHandler);
  }

  patch(...args: any[]) {
    const funcHandler: RouteHandlers = this.parseHandler(args);
    this.#add('patch', funcHandler);
  }

  #readConfig = async (config?: any) => {
    const cwd = Deno.cwd();
    if(!config){
      try{
        config = (await import (join(cwd, 'min.config.js'))).default;
      }catch(e){
        throw Error ('no such file named min.config.js, please check the name or provide a min.config.js by yourself ');
      }
    }
    const { server, routes, cors: corsConfig, assets: assetsConfig = './assets' } = config;
    // set server config
    appConfig.server = server.addr
      ? {...server, ...parseAddress(server.addr)}
      : server;
    routes.length
      && await this.#setRoutes(routes, cwd);
    corsConfig
      && this.use(cors(corsConfig));
    assetsConfig
      && this.use(assets(assetsConfig));
  }

  #listen = async (): Promise<void> => {
    const server = appConfig.server;
    const isTls = server.secure;
    const protocol = isTls ? 'https' : 'http';
    try{
      // @ts-ignore
      const Server = isTls ? serveTLS(server) : serve(server);
      console.log(colors.black(`server is listening ${protocol}://${server.hostname}:${server.port} `))
      for await (let request of Server){
        const req: Req = new Request({
          url: request.url,
          method: request.method as ReqMethod,
          headers: request.headers,
          request
        }).getRequest();
        const res: Res = new Response().getResponse();
        await this.#router.handleRoute(req, res);
        // 如果没有send完成请求, 才调用send
        if(!res.done){
          send(req, res);
        }
      }
    }catch(e){
      throw new Error(e);
    }
  }

  async start(config?: any){
    await this.#readConfig(config);
    await this.#listen();
  }

}
