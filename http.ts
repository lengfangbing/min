import {
  ServerRequest,
  Response
} from "./deps.ts";

export type ReqMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace';
export type ReqObjectField = {[key: string]: boolean | string | number | ReqObjectField | string[] | Uint8Array | Uint16Array | Uint32Array} | null | string;
export interface Res{
  response: Response,
  body: any | null,
  headers: Headers,
  status: number,
  done: boolean,
  redirect: Function,
  render: Function
}

export interface Req{
  query: ReqObjectField,
  body: ReqObjectField,
  url: string,
  method: ReqMethod,
  headers: Headers,
  request: ServerRequest,
  params: ReqObjectField
}
