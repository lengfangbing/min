import { Min } from "../type.ts";
import { Entity } from "./entity.test.ts";

// @TODO 实现中间件的装饰器方法需要修改数据结构

export const Route = (prefix?: string): ClassDecorator => {
  const entity = Entity.getInstance();
  return (target) => {
    // 设置prefix
    entity.setPrefix(target, prefix || "");
  };
};

export const Middleware: MethodDecorator = <T = unknown>(
  target: unknown,
  _propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => {
  if (typeof descriptor.value === "function") {
    const entity = Entity.getInstance();
    // 这里先在使用时保证时中间件的类型
    // 设置全局中间件
    entity.setMiddleware(
      target,
      descriptor.value as unknown as Min.Middleware.MiddlewareFunc,
    );
  } else {
    throw new Error("Middleware decorator can only use for function");
  }
  return descriptor;
};

const createRouteDecorator = (method: Min.Router.Method) => {
  return (
    path: string,
    ...args: Array<Min.Middleware.MiddlewareFunc>
  ): MethodDecorator => {
    const entity = Entity.getInstance();
    const middleware = args as Array<Min.Middleware.MiddlewareFunc> || [];
    return function <T = unknown>(
      target: unknown,
      _propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<T>,
    ) {
      if (typeof descriptor.value === "function") {
        const handler = descriptor.value as unknown as Min.Router.HandlerFunc;
        // 因为参数装饰器可以拿到这个方法，并且会添加到routes里，所以这里我们需要查找这个handler对应的route
        // 如果找不到就表明这个方法没有参数装饰器
        const findRoute = entity.getRoutes(target)?.find((item) =>
          item.handler === handler
        );
        if (findRoute) {
          // 如果找到了，就修改path，还有middleware
          findRoute.path = path;
          findRoute.middleware = middleware;
          findRoute.method = method;
        } else {
          // 如果没找到，重新添加一个新的不包含exec的route
          entity.setRoutes(target, {
            path,
            handler,
            exec: [],
            middleware,
            method: method,
          });
        }
      } else {
        throw new Error(
          `${method} method decorator can only use for function, occurred path: ${path}`,
        );
      }
      return descriptor;
    };
  };
};

export const Get = createRouteDecorator("GET");
export const Post = createRouteDecorator("POST");
export const Put = createRouteDecorator("PUT");
export const Delete = createRouteDecorator("DELETE");
export const Options = createRouteDecorator("OPTIONS");
export const Patch = createRouteDecorator("PATCH");

const createParameterDecorator = (
  exec?: Array<string>,
): ParameterDecorator => {
  return (target: unknown, propertyKey: string | symbol, _parameterIndex) => {
    const entity = Entity.getInstance();
    const handler =
      (target as Record<string, unknown>)[propertyKey as string] as (
        | Min.Router.HandlerFunc
        | void
      );
    // 在routes里去查找这个handler，参数装饰器只会修改exec，不会修改其他的routes的参数
    const findRoute = entity.getRoutes(target)?.find((item) =>
      item.handler === handler
    );
    if (findRoute && exec) {
      // 如果找到了这个findRoute，就修改exec，因为解析参数装饰器是倒叙的，所以需要倒叙插入exec
      findRoute.exec.unshift(exec);
    } else {
      if (typeof handler === "function") {
        // 如果没找到这个findRoute，就添加这个handler的routes，因为handler是没有顺序的，所以直接set就可以
        entity.setRoutes(target, {
          path: "",
          middleware: [],
          exec: exec ? [exec] : [],
          handler,
          method: "GET", // 这个method不用关注，在Get等方法装饰器中会重新修改method的值，所以先赋值一个Get即可
        });
      } else {
        // 如果这个handler不是方法，那么就出错了，不添加这个路由
        return;
      }
    }
  };
};

export const Query = (paramKey?: string): ParameterDecorator => {
  const exec: Array<string> = typeof paramKey === "string"
    ? ["request", "query", paramKey]
    : ["request", "query"];
  return createParameterDecorator(exec);
};

export const Ctx = createParameterDecorator(['']);

export const Body = (paramKey?: string): ParameterDecorator => {
  const exec: Array<string> = typeof paramKey === "string"
    ? ["request", "body", paramKey]
    : ["request", "body"];
  return createParameterDecorator(exec);
};

export const Params = (paramKey?: string): ParameterDecorator => {
  const exec: Array<string> = typeof paramKey === "string"
    ? ["request", "params", paramKey]
    : ["request", "params"];
  return createParameterDecorator(exec);
};

export const Request = createParameterDecorator(['request']);

// 执行顺序，最内层 - 最外层
// 装饰器只会装饰，不会改变任何值，所以使用必须要保证装饰器执行的顺序

Deno.test({
  name: "decorator runtime core",
  fn() {
    console.log("method test case moved to test_case.test.ts");
  },
});
