import {MethodFuncArgument} from "../model.ts";
import {setRoutes} from "./entity.ts";

export const Get = (path: string, args?: MethodFuncArgument): MethodDecorator => {
  console.log('get exec');
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

export const Post = (path: string, args?: MethodFuncArgument): MethodDecorator => {
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

export const Delete = (path: string, args: MethodFuncArgument): MethodDecorator => {
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

export const Put = (path: string, args?: MethodFuncArgument): MethodDecorator => {
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

export const Patch = (path: string, args?: MethodFuncArgument): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: 'patch',
    });
    return descriptor;
  }
}

export const Options = (path: string, args?: MethodFuncArgument): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: 'options',
    });
    return descriptor;
  }
}

export const Head = (path: string, args?: MethodFuncArgument): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: 'head',
    });
    return descriptor;
  }
}

export const Connect = (path: string, args?: MethodFuncArgument): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: 'connect',
    });
    return descriptor;
  }
}

export const Trace = (path: string, args?: MethodFuncArgument): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: 'trace',
    });
    return descriptor;
  }
}
