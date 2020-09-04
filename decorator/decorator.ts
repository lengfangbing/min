import {getRouterInitial, getRoutes, setApp, setRoutes, clearRoutes, setServer} from "./entity.ts";
import {App} from "./app.ts";
import {DecorationApplication} from "./application.ts";
import {ListenOptions, MethodFuncArgument, MiddlewareFunc} from "../model.ts";

const StartApplication: ClassDecorator = target => {
  const router = getRouterInitial();
  setApp(new DecorationApplication());
  const path = target.prototype.decorator_prefix_min || '';
  getRoutes().forEach(val => {
    router[val.method](path + val.path, val.handler, val.middleware);
  });
  clearRoutes();
  return target;
}

const Module: ClassDecorator = target => {
  const router = getRouterInitial();
  const path = target.prototype.decorator_prefix_min || '';
  getRoutes().forEach(val => {
    router[val.method](path + val.path, val.handler, val.middleware);
  });
  clearRoutes();
  return target;
}

const Prefix = (path: string): ClassDecorator => {
  return target => {
    target.prototype.decorator_prefix_min = path;
    return target;
  }
}

const Start = (server: ListenOptions): MethodDecorator => {
  setServer(server);
  return (target, propertyKey, descriptor) => {
    return descriptor;
  }
}

const Get = (path: string, args?: MethodFuncArgument): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: 'get',
    });
    return descriptor;
  }
}

const Post = (path: string, args?: MethodFuncArgument): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: 'post',
    });
    return descriptor;
  }
}

const Delete = (path: string, args: MethodFuncArgument): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: 'delete',
    });
    return descriptor;
  }
}

const Put = (path: string, args?: MethodFuncArgument): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: 'put',
    });
    return descriptor;
  }
}

export {StartApplication, App, Prefix, Start, Get, Post, Delete, Put, Module};
