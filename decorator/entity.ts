import { Entity } from "./decorator.type.ts";
import { Middleware } from "./middleware.ts";
import { Router } from "./router.ts";
import { DecorationApplication } from "./application.ts";
import {HandlerFunc, ListenOptions, MiddlewareFunc} from "../model.ts";

const defaultServer = {
  port: 8000,
  hostname: "127.0.0.1",
};

const entity: Entity = {
  // application
  app: null,
  // router
  router: null,
  // server config
  server: defaultServer,
  // middleware
  middleware: null,
  // 可消费数组
  routes: [],
  // 可消费中间件
  middlewares: [],
  // 路由快照
  snapshotRoutes: [],
  // 每个ParameterDecorator可消费数组
  paramsExecRoutes: [],
  // 每次Application和Route可消费数组, 用来增加Router的handler的参数exec执行指令
  execRoutes: [],
};

export function getAppInitial(): DecorationApplication {
  if (entity.app === null) {
    setApp(new DecorationApplication());
  }
  return entity.app as DecorationApplication;
}

export function setApp(app: DecorationApplication) {
  entity.app = app;
}

export function getRouterInitial(): Router {
  if (entity.router === null) {
    setRouter(new Router());
  }
  return entity.router as Router;
}

export function setRouter(router: Router) {
  entity.router = router;
}

export function getServer() {
  return entity.server;
}

export function setServer(server: ListenOptions) {
  entity.server = server;
}

export function getMiddlewareInitial(): Middleware {
  if (entity.middleware === null) {
    setMiddleware(new Middleware());
  }
  return entity.middleware as Middleware;
}

export function setMiddleware(middleware: Middleware) {
  entity.middleware = middleware;
}

export function getRoutes() {
  return entity.routes;
}

export function setRoutes(routes: Entity["routes"][number]) {
  entity.routes.push(routes);
}

export function clearRoutes() {
  entity.routes = [];
}

export function getMiddlewares() {
  return entity.middlewares;
}

export function setMiddlewares(func: MiddlewareFunc) {
  entity.middlewares.push(func);
}

export function clearMiddlewares() {
  entity.middlewares = [];
}

export function getSnapshotRoutes() {
  return entity.snapshotRoutes;
}

export function setSnapshotRoutes(item: {
  url: string;
  method: string;
  handler: HandlerFunc;
}) {
  entity.snapshotRoutes.push(item);
}

export function getParamsExecRoutes() {
  return entity.paramsExecRoutes;
}

export function setParamsExecRoutes(exec: string, handler: HandlerFunc) {
  entity.paramsExecRoutes.push({
    exec,
    handler,
  });
}

export function clearParamsExecRoutes() {
  entity.paramsExecRoutes = [];
}

export function getExecRoutes() {
  return entity.execRoutes;
}

export function setExecRoutes(url: string, method: string, exec: string) {
  entity.execRoutes.push({
    url,
    method,
    exec,
  });
}

export function clearExecRoutes() {
  entity.execRoutes = [];
}
