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
  ReqMethod
} from "./http.ts";
import {
  Middleware
} from "./middleware.ts";
import {
  parseAddress
} from "./utils/address/address.ts";
import {
  AppConfig,
  ListenOptions,
  RouteHandlers,
  RoutesConfig
} from "./model.ts";
import {
  cors
} from "./cors.ts";
import {
  assets
} from "./assets.ts";
// min.config.ts后调用#listen保存的参数
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
  #parseHandler = (handlers: any[]): RouteHandlers => {
    if(handlers.length < 2) throw new Error('router has no match url or handler function');
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
    const funcHandler: RouteHandlers = this.#parseHandler(args);
    this.#add('get', funcHandler);
    return this;
  }

  post(...args: any[]) {
    const funcHandler: RouteHandlers = this.#parseHandler(args);
    this.#add('post', funcHandler);
    return this;
  }

  put(...args: any[]) {
    const funcHandler: RouteHandlers = this.#parseHandler(args);
    this.#add('put', funcHandler);
    return this;
  }

  delete(...args: any[]) {
    const funcHandler: RouteHandlers = this.#parseHandler(args);
    this.#add('delete', funcHandler);
    return this;
  }

  options(...args: any[]) {
    const funcHandler: RouteHandlers = this.#parseHandler(args);
    this.#add('options', funcHandler);
    return this;
  }

  head(...args: any[]) {
    const funcHandler: RouteHandlers = this.#parseHandler(args);
    this.#add('head', funcHandler);
    return this;
  }

  connect(...args: any[]) {
    const funcHandler: RouteHandlers = this.#parseHandler(args);
    this.#add('connect', funcHandler);
    return this;
  }

  trace(...args: any[]) {
    const funcHandler: RouteHandlers = this.#parseHandler(args);
    this.#add('trace', funcHandler);
    return this;
  }

  patch(...args: any[]) {
    const funcHandler: RouteHandlers = this.#parseHandler(args);
    this.#add('patch', funcHandler);
    return this;
  }

  #readConfig = async (config?: any) => {
    const cwd = Deno.cwd();
    if(!config){
      try{
        config = (await import (join(cwd, 'min.config.ts'))).default;
      }catch(e){
        throw Error ('no such file named min.config.ts, please check the name or provide a min.config.js by yourself ');
      }
    }
    const { server, routes, cors: corsConfig, assets: assetsConfig = '' } = config;
    // set server config
    appConfig.server = server.addr
      ? {...server, ...parseAddress(server.addr)}
      : server;
    routes?.length
      && await this.#setRoutes(routes, cwd);
    corsConfig
      && this.use(cors(corsConfig));
    this.use(assets(assetsConfig));
  }

  #listen = async (): Promise<void> => {
    const server = appConfig.server;
    const isTls = server.secure;
    const protocol = isTls ? 'https' : 'http';
    try{
      const Server = isTls ? serveTLS(server as any) : serve(server);
      console.log(colors.white(`server is listening ${protocol}://${server.hostname}:${server.port} `))
      for await (let request of Server){
        await this.#router.handleRoute(request);
      }
    }catch(e){
      throw new Error(e);
    }
  }

  async listen(config?: string | ListenOptions){
    if(typeof config === 'string'){
      appConfig.server = parseAddress(config);
    } else {
      appConfig.server = config as ListenOptions;
    }
    await this.#listen();
  }

  async start(config?: any){
    await this.#readConfig(config);
    await this.#listen();
  }
}
