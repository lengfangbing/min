import {Entity} from "./decorator.type.ts";
import {Middleware} from "./middleware.ts";
import {Router} from "./router.ts";
import {DecorationApplication} from "./application.ts";
import {ListenOptions} from "../model.ts";

const defaultServer = {
  port: 8000,
  hostname: '127.0.0.1'
};

const entity: Entity = {
  app: null,
  router: null,
  server: defaultServer,
  middleware: null,
};

export function getApp() {
  return entity.app;
}

export function getAppInitial(): DecorationApplication {
  if (entity.app === null) {
    setApp(new DecorationApplication());
  }
  return entity.app as DecorationApplication;
}

export function getRouter() {
  return entity.router;
}

export function getRouterInitial(): Router {
  if (entity.router === null) {
    setRouter(new Router());
  }
  return entity.router as Router;
}

export function getServer() {
  return entity.server;
}

export function getMiddleware() {
  return entity.middleware;
}

export function getMiddlewareInitial(): Middleware {
  if (entity.middleware === null) {
    setMiddleware(new Middleware());
  }
  return entity.middleware as Middleware;
}

export function setApp(app: any) {
  entity.app = app;
}

export function setRouter(router: any) {
  entity.router = router;
}

export function setServer(server: ListenOptions) {
  entity.server = server;
}

export function setMiddleware(middleware: Middleware) {
  entity.middleware = middleware;
}
