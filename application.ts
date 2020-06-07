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

  // #add = (method: ReqMethod, handlers: RouteHandlers) => {
  //   const { url, handler, middleWare } = handlers;
  //   this.#router[method](url, handler);
  //   // this.#router[method](url, handler);
  // }

  #add = (method: ReqMethod, url: string, handler: Function) => {
    this.#router[method](url, handler);
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
      const { url, func } = value;
      const realFunc =
        typeof func === 'string'
          ? (await import(join(cwd, func))).default
          : func;
      this.#add(method, url, realFunc);
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
      res.middleWare = handlers;
    }
    return res;
  }

  // get(...args: any[]) {
  //   const funcHandler: RouteHandlers = this.parseHandler(args);
  //   console.log(funcHandler);
  //   // this.#add('get', url, handler);
  // }

  get(url: string, handler: Function) {
    this.#add('get', url, handler);
  }

  post(url: string, handler: Function) {
    this.#add('post', url, handler);
  }

  put(url: string, handler: Function) {
    this.#add('put', url, handler);
  }

  delete(url: string, handler: Function) {
    this.#add('delete', url, handler);
  }

  options(url: string, handler: Function) {
    this.#add('options', url, handler);
  }

  head(url: string, handler: Function) {
    this.#add('head', url, handler);
  }

  connect(url: string, handler: Function) {
    this.#add('connect', url, handler);
  }

  trace(url: string, handler: Function) {
    this.#add('trace', url, handler);
  }

  patch(url: string, handler: Function) {
    this.#add('patch', url, handler);
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
    console.log(colors.black('starting server ... \n'));
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
