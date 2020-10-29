import { HandlerFunc, MethodFuncArgument, MiddlewareFunc } from "../model.ts";
import {
  clearParamsExecRoutes,
  getParamsExecRoutes,
  getSnapshotRoutes,
  setExecRoutes,
  setMiddlewares,
  setRoutes,
  setSnapshotRoutes,
} from "./entity.ts";

const consumeParamsExec = (
  url: string,
  method: string,
  handler: HandlerFunc,
) => {
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

const commonMiddleware = (
  url: string,
  method: string,
  handler: HandlerFunc,
) => {
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
  return function <T>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const isFunction = (func: unknown): func is HandlerFunc => {
      return typeof func === "function";
    };
    if (isFunction(descriptor.value)) {
      commonMiddleware(path, "get", descriptor.value);
      setRoutes({
        middleware: args || [],
        handler: descriptor.value,
        path,
        method: "get",
      });
    } else {
      throw Error(`${descriptor.value} is not a Function`);
    }
    return descriptor;
  };
};

export const Post = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function <T>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const isFunction = (func: unknown): func is HandlerFunc => {
      return typeof func === "function";
    };
    if (isFunction(descriptor.value)) {
      commonMiddleware(path, "post", descriptor.value);
      setRoutes({
        middleware: args || [],
        handler: descriptor.value,
        path,
        method: "post",
      });
    } else {
      throw Error(`${descriptor.value} is not a Function`);
    }
    return descriptor;
  };
};

export const Delete = (
  path: string,
  args: MethodFuncArgument,
): MethodDecorator => {
  return function <T>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const isFunction = (func: unknown): func is HandlerFunc => {
      return typeof func === "function";
    };
    if (isFunction(descriptor.value)) {
      commonMiddleware(path, "delete", descriptor.value);
      setRoutes({
        middleware: args || [],
        handler: descriptor.value,
        path,
        method: "delete",
      });
    } else {
      throw Error(`${descriptor.value} is not a Function`);
    }
    return descriptor;
  };
};

export const Put = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function <T>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const isFunction = (func: unknown): func is HandlerFunc => {
      return typeof func === "function";
    };
    if (isFunction(descriptor.value)) {
      commonMiddleware(path, "put", descriptor.value);
      setRoutes({
        middleware: args || [],
        handler: descriptor.value,
        path,
        method: "put",
      });
    } else {
      throw Error(`${descriptor.value} is not a Function`);
    }
    return descriptor;
  };
};

export const Patch = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function <T>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const isFunction = (func: unknown): func is HandlerFunc => {
      return typeof func === "function";
    };
    if (isFunction(descriptor.value)) {
      commonMiddleware(path, "patch", descriptor.value);
      setRoutes({
        middleware: args || [],
        handler: descriptor.value,
        path,
        method: "patch",
      });
    } else {
      throw Error(`${descriptor.value} is not a Function`);
    }
    return descriptor;
  };
};

export const Options = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function <T>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const isFunction = (func: unknown): func is HandlerFunc => {
      return typeof func === "function";
    };
    if (isFunction(descriptor.value)) {
      commonMiddleware(path, "options", descriptor.value);
      setRoutes({
        middleware: args || [],
        handler: descriptor.value,
        path,
        method: "options",
      });
    } else {
      throw Error(`${descriptor.value} is not a Function`);
    }
    return descriptor;
  };
};

export const Head = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function <T>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const isFunction = (func: unknown): func is HandlerFunc => {
      return typeof func === "function";
    };
    if (isFunction(descriptor.value)) {
      commonMiddleware(path, "head", descriptor.value);
      setRoutes({
        middleware: args || [],
        handler: descriptor.value,
        path,
        method: "head",
      });
    } else {
      throw Error(`${descriptor.value} is not a Function`);
    }
    return descriptor;
  };
};

export const Connect = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function <T>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const isFunction = (func: unknown): func is HandlerFunc => {
      return typeof func === "function";
    };
    if (isFunction(descriptor.value)) {
      commonMiddleware(path, "connect", descriptor.value);
      setRoutes({
        middleware: args || [],
        handler: descriptor.value,
        path,
        method: "connect",
      });
    } else {
      throw Error(`${descriptor.value} is not a Function`);
    }
    return descriptor;
  };
};

export const Trace = (
  path: string,
  args?: MethodFuncArgument,
): MethodDecorator => {
  return function <T>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ) {
    const isFunction = (func: unknown): func is HandlerFunc => {
      return typeof func === "function";
    };
    if (isFunction(descriptor.value)) {
      commonMiddleware(path, "trace", descriptor.value);
      setRoutes({
        middleware: args || [],
        handler: descriptor.value,
        path,
        method: "trace",
      });
    } else {
      throw Error(`${descriptor.value} is not a Function`);
    }
    return descriptor;
  };
};
