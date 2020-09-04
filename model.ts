import {
  Response,
  ServerRequest
} from "./deps.ts";
import {
  Cookie
} from "./cookie.ts";

export type ReqMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace';
export type ReqBody = {
  type: string,
  value: any,
}
export type HandlerFunc = (req: Req, res: Res) => Promise<unknown> | unknown
export type MiddlewareFunc = (req: Req, res: Res, next: Function) => Promise<unknown> | unknown
export type MethodFuncArgument = Array<MiddlewareFunc>

export interface AppConfig {
  server: ListenOptions
}

export interface RoutesConfig {
  url: string,
  method: string,
  func: HandlerFunc
  middleware?: MiddlewareFunc[]
}
export interface NewRoute {
  next: Record<string, NewRoute> | null
  middleware: Function[]
  handler: Function | null,
  paramsNames: {[key: string]: string }
}
export interface RouteHandlers {
  middleware?: Function[],
  handler: HandlerFunc
}
export interface RouteValue {
  query: { [key: string]: string }
  url: string
  params: { [key: string]: string },
  handler: Function,
  middleware: Function[]
}
export interface SingleRoute {
  middleware: Function[],
  handler: Function,
  paramsNames: {[key: string]: string }
}

export interface CorsOptions {
  allowMethods?: string[],
  allowHeaders?: string[],
  origin?: string | Function,
  allowCredentials?: boolean,
  maxAge?: number,
  exposeHeaders?: string[]
}

export interface ListenOptions {
  port: number,
  hostname: string,
  certFile?: string,
  isHttps?: boolean,
  secure?: boolean,
  keyFile?: string
}

export interface RealUrl {
  url: string,
  query?: { [key: string]: any } | null,
  prefix?: string,
  params?: string | null,
  paramsName?: string,
  extName?: string
}

export interface AssetsOptions {

}

export interface Req {
  query: Record<string, any>,
  body: {
    type: string,
    value: any
  },
  url: string,
  method: ReqMethod,
  headers: Headers,
  request: ServerRequest,
  params: Record<string, any>,
  cookies: Map<string, any>
}
export interface Res {
  response: Response,
  body: any | null,
  headers: Headers,
  status: number,
  done: boolean,
  redirect: Function,
  render: Function,
  send: Function,
  cookies: Cookie
}
export interface MinConfig {
  server: ListenOptions,
  routes: RoutesConfig[],
  cors?: CorsOptions,
  assets?: string | Record<string, any>
}
