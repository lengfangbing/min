import { MethodFuncArgument } from "../model.ts";
import {
  clearParamsExecRoutes,
  getParamsExecRoutes,
  getSnapshotRoutes,
  setExecRoutes,
  setRoutes,
  setSnapshotRoutes,
} from "./entity.ts";

const consumeParamsExec = (url: string, method: string, handler: Function) => {
  // 消费params指令数组
  const findItem = getParamsExecRoutes().filter((item) =>
    item.handler === handler
  );
  if (findItem.length) {
    findItem.forEach((val) => {
      // 找到了相同的route handler
      const func = val.handler;
      const snapshotRoutes = getSnapshotRoutes().find((item) =>
        item.handler === func
      );
      if (snapshotRoutes) {
        // 添加到新的数组里, 在Application和Route时去消费这个数组, 对应url, 找到后修改exec
        setExecRoutes(url, method, val.exec);
      }
    });
  }
  // 清除params指令数组
  clearParamsExecRoutes();
};

// const consume

const commonMiddleware = (url: string, method: string, handler: Function) => {
  // 增加路由快照
  setSnapshotRoutes({
    url,
    method,
    handler,
  });
  consumeParamsExec(url, method, handler);
};

export const Get = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    commonMiddleware(path, "get", descriptor.value);
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: "get",
    });
    return descriptor;
  };
};

export const Post = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    commonMiddleware(path, "post", descriptor.value);
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: "post",
    });
    return descriptor;
  };
};

export const Delete = (
  path: string,
  args: MethodFuncArgument,
): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    commonMiddleware(path, "delete", descriptor.value);
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: "delete",
    });
    return descriptor;
  };
};

export const Put = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    commonMiddleware(path, "put", descriptor.value);
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: "put",
    });
    return descriptor;
  };
};

export const Patch = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    commonMiddleware(path, "patch", descriptor.value);
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: "patch",
    });
    return descriptor;
  };
};

export const Options = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    commonMiddleware(path, "options", descriptor.value);
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: "options",
    });
    return descriptor;
  };
};

export const Head = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    commonMiddleware(path, "head", descriptor.value);
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: "head",
    });
    return descriptor;
  };
};

export const Connect = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    commonMiddleware(path, "connect", descriptor.value);
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: "connect",
    });
    return descriptor;
  };
};

export const Trace = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function (target, propertyKey, descriptor: any) {
    commonMiddleware(path, "trace", descriptor.value);
    setRoutes({
      middleware: args || [],
      handler: descriptor.value,
      path,
      method: "trace",
    });
    return descriptor;
  };
};
