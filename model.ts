import { Response, ServerRequest } from "./deps.ts";
import { Cookie } from "./cookie.ts";

export type ReqMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "options"
  | "head"
  | "connect"
  | "trace";

export type ReqBody = {
  type: string;
  value: string | number | Record<string, string | number | Uint8Array>;
};

export type HandlerFunc = (req: Req, res: Res) => Promise<void> | void;

export type NextFunc = () => Promise<void>;

export type MiddlewareFunc = (
  req: Req,
  res: Res,
  next: NextFunc,
) => Promise<void> | void;

export type MethodFuncArgument = Array<MiddlewareFunc>;

export interface AppConfig {
  server: ListenOptions;
}

export interface RoutesConfig {
  url: string;
  method: string;
  func: HandlerFunc;
  middleware?: MethodFuncArgument;
}

export interface RouteHandlers {
  middleware?: Array<MiddlewareFunc>;
  handler: HandlerFunc;
}

export interface RouteValue {
  query: Record<string, string>;
  url: string;
  params: Record<string, string>;
  handler: HandlerFunc;
  middleware: Array<MiddlewareFunc>;
}

export interface SingleRoute {
  middleware: Array<MiddlewareFunc>;
  handler: HandlerFunc;
  paramsNames: Record<string, string>;
}

export interface NewRoute {
  next: Record<string, NewRoute> | null;
  middleware: Array<MiddlewareFunc>;
  handler: HandlerFunc | null;
  paramsNames: Record<string, string>;
}

export interface CorsOptions {
  allowMethods?: Array<string>;
  allowHeaders?: Array<string>;
  origin?: string | ((req: Req) => Promise<string>);
  allowCredentials?: boolean;
  maxAge?: number;
  exposeHeaders?: Array<string>;
}

export interface ListenOptions {
  port: number;
  hostname: string;
  certFile?: string;
  isHttps?: boolean;
  secure?: boolean;
  keyFile?: string;
}

export interface RealUrl {
  url: string;
  query?: Record<string, string> | null;
  prefix?: string;
  params?: string | null;
  paramsName?: string;
  extName?: string;
}

export type AssetsOptions = {
  // developing
  path: string;
  onerror: (e: Error) => void;
}

export type AssetsArgument = string | AssetsOptions;

export interface Req {
  query: Record<string, string>;
  body: ReqBody;
  url: string;
  method: ReqMethod;
  headers: Headers;
  request: ServerRequest;
  params: Record<string, string>;
  cookies: Map<string, string | boolean>;
  [key: string]: unknown;
}

export interface Res {
  response: Response;
  // 返回值类型可以是任意的
  // deno-lint-ignore no-explicit-any
  body: any;
  headers: Headers;
  status: number;
  done: boolean;
  redirect: (url: string) => void;
  render: (path: string) => Promise<void>;
  send: (req: Req, res: Res) => void;
  cookies: Cookie;
}

export interface MinConfig {
  server: ListenOptions;
  routes: Array<RoutesConfig>;
  cors?: CorsOptions;
  assets?: string | Record<string, string | number | boolean>;
}

export type ErrorMessage = {
  path: string;
  req: Req;
  error: string;
  position: string;
};
