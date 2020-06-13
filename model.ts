import {
  Response,
  ServerRequest
} from "./deps.ts";
export type ReqMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace';
export type ReqObjectField =
  { [key: string]: boolean | string | number | ReqObjectField | string[] | Uint8Array | Uint16Array | Uint32Array }
  | null
  | string;

export interface AppConfig {
  server: ListenOptions
}

export interface RoutesConfig {
  url: string,
  method: string,
  func: string | Function
  middleware?: Function[]
}

export interface MethodMapValue {
  paramsName?: string;
  params?: string;
  dynamicHandler?: Function;
  dynamicMiddleware?: Function[];
  middleware: Function[];
  handler: Function;
}

export interface RouteHandlers {
  url: string,
  middleware?: Function[],
  handler: Function
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

export interface Res {
  response: Response,
  body: any | null,
  headers: Headers,
  status: number,
  done: boolean,
  redirect: Function,
  render: Function,
  send: Function
}

export interface Req {
  query: ReqObjectField,
  body: ReqObjectField,
  url: string,
  method: ReqMethod,
  headers: Headers,
  request: ServerRequest,
  params: ReqObjectField
}

export interface MinConfig {
  server: ListenOptions,
  routes: RoutesConfig[],
  cors?: CorsOptions,
  assets?: string
}
