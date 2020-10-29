import {MethodFuncArgument, MiddlewareFunc} from "../model.ts";

export class Middleware {
  static middle: MethodFuncArgument = [];

  push(func: MiddlewareFunc) {
    Middleware.middle.push(func);
  }

  getMiddle() {
    return Middleware.middle;
  }
}
