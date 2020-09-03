import {Entity, MiddlewareFunc, ServerConfig} from "./lib.min.d.ts";

const defaultServer = {
  port: 8000,
  hostname: '127.0.0.1'
};

const entity: Entity = {
  app: null,
  router: null,
  server: defaultServer,
  middleware: [],
};

export function getApp() {
  return entity.app;
}

export function getRouter() {
  return entity.router;
}

export function getServer() {
  return entity.server;
}

export function getMiddleware() {
  return entity.middleware;
}

export function setApp(app: any) {
  entity.app = app;
}

export function setRouter(router: any) {
  entity.router = router;
}

export function setServer(server: ServerConfig) {
  entity.server = server;
}

export function setMiddleware(middleware: MiddlewareFunc) {
  entity.middleware.push(middleware);
}
