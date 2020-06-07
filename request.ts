import {
  Req,
  ReqMethod
} from "./http.ts";
import {
  ServerRequest
} from "./deps.ts";

const DEFAULT_REQ = {
  query: null,
  params: null,
  body: null,
  request: new ServerRequest(),
  url: '',
  method: 'get' as ReqMethod,
  headers: new Headers()
};

export class Request{
  request: Req

  constructor(data: any) {
    this.request = {
      ...DEFAULT_REQ,
      ...data
    }
  }

  getRequest(){
    return this.request;
  }
}
