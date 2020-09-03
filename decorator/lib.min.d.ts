import {ServerRequest} from "./deps.ts";
import {Cookie} from "./cookie.ts";

export declare type ReqObjectField =
  Record<string, any>
  | null
  | string;

export declare type ReqMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace';

export declare interface Req {
  query: ReqObjectField,
  body: ReqObjectField,
  url: string,
  method: ReqMethod,
  headers: Headers,
  request: ServerRequest,
  params: ReqObjectField,
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

export declare type MiddlewareFunc = (req: Req, res: Res, next?: Function) => Promise<unknown> | unknown;

export declare type Entity = {
  app: any,
  router: any,
  server: ServerConfig,
  middleware: MiddlewareFunc[],
};

export declare type ServerConfig = {
  port: number,
  hostname: string,
  certFile?: string,
  isHttps?: boolean,
  secure?: boolean,
  keyFile?: string
}
