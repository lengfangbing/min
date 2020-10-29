import { Middleware } from "./middleware.ts";
import { DecorationApplication } from "./application.ts";
import { Router } from "./router.ts";
import {
  HandlerFunc,
  ListenOptions,
  MethodFuncArgument,
  MiddlewareFunc,
  ReqMethod,
} from "../model.ts";

export declare type ParamsExecRouteItem = {
  exec: string;
  handler: HandlerFunc;
};

export declare type ExecRouteItem = {
  url: string;
  method: string;
  exec: string;
};

export declare type Entity = {
  app: DecorationApplication | null;
  router: Router | null;
  server: ListenOptions;
  middleware: Middleware | null;
  routes: Array<{
    path: string;
    method: ReqMethod;
    middleware: MethodFuncArgument;
    handler: HandlerFunc;
  }>;
  middlewares: MethodFuncArgument;
  snapshotRoutes: Array<{
    handler: HandlerFunc;
    url: string;
    method: string;
  }>;
  paramsExecRoutes: Array<ParamsExecRouteItem>;
  execRoutes: Array<ExecRouteItem>;
};
