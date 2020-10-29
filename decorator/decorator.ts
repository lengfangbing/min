import {
  clearExecRoutes,
  clearMiddlewares,
  clearRoutes,
  getExecRoutes,
  getMiddlewareInitial,
  getMiddlewares,
  getRouterInitial,
  getRoutes,
  setApp,
  setMiddlewares,
  setParamsExecRoutes,
  setServer,
} from "./entity.ts";
import { App } from "./app.ts";
import { DecorationApplication } from "./application.ts";
import { ListenOptions, MethodFuncArgument, MiddlewareFunc } from "../model.ts";

// deno-lint-ignore ban-types
const consumeApplication: ClassDecorator = (target: Function) => {
  const middleware = getMiddlewareInitial();
  const router = getRouterInitial();
  const path = target.prototype.decorator_prefix_min || "";
  getMiddlewares().forEach((val) => {
    middleware.push(val);
  });
  getRoutes().forEach((val) => {
    router[val.method](path + val.path, val.handler, val.middleware);
  });
  clearMiddlewares();
  clearRoutes();
};

// deno-lint-ignore ban-types
const consumeRoutes: ClassDecorator = (target: Function) => {
  const router = getRouterInitial();
  const path = target.prototype.decorator_prefix_min || "";
  getRoutes().forEach((val) => {
    router[val.method](
      path + val.path,
      val.handler,
      getMiddlewares().concat(val.middleware),
    );
  });
  clearMiddlewares();
  clearRoutes();
};

const consumeExecRoutes = () => {
  const router = getRouterInitial();
  getExecRoutes().forEach((value) => {
    // 查找需要增加exec指令的路由
    const { method, url, exec } = value;
    const find = router.find(method, url);
    if (find) {
      // 如果找到了, 更改exec
      find.exec.push(exec);
    }
  });
  clearExecRoutes();
};

const StartApplication: ClassDecorator = (target) => {
  setApp(new DecorationApplication());
  consumeApplication(target);
  consumeExecRoutes();
  return target;
};

const Route: ClassDecorator = (target) => {
  consumeRoutes(target);
  consumeExecRoutes();
  return target;
};

const Prefix = (path: string): ClassDecorator => {
  return (target) => {
    target.prototype.decorator_prefix_min = path;
    return target;
  };
};

const Middleware: MethodDecorator = <T>(
  target: unknown,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => {
  const isFunction = (func: unknown): func is MiddlewareFunc => {
    return typeof func === "function";
  };
  if (isFunction(descriptor.value)) {
    setMiddlewares(descriptor.value);
  } else {
    throw Error(`${descriptor.value} is not a Function`);
  }
  return descriptor;
};

const ApplyMiddleware = (args: MethodFuncArgument): MethodDecorator => {
  args.forEach((val) => {
    setMiddlewares(val);
  });
  return (target, propertyKey, descriptor) => {
    return descriptor;
  };
};

const Start = (server: ListenOptions): MethodDecorator => {
  setServer(server);
  return (target: unknown, propertyKey: string | symbol, descriptor) => {
    return descriptor;
  };
};

const Query = (qid?: string): ParameterDecorator => {
  const exec = qid ? `query.${qid}` : "query";
  // deno-lint-ignore ban-types
  return (target: Object, propertyKey: string | symbol) => {
    const func = Reflect.getOwnPropertyDescriptor(target, propertyKey)?.value as
      | (() => void | Promise<void>)
      | undefined;
    if (!func) {
      throw Error("Query decorator can only be used as function parameter");
    }
    // 增加执行exec操作指令到params指令数组
    setParamsExecRoutes(exec, func);
  };
};

const Param = (pid?: string): ParameterDecorator => {
  const exec = pid ? `params.${pid}` : "params";
  // deno-lint-ignore ban-types
  return (target: Object, propertyKey: string | symbol) => {
    const func = Reflect.getOwnPropertyDescriptor(target, propertyKey)?.value as
      | (() => void | Promise<void>)
      | undefined;
    if (!func) {
      throw Error("Query decorator can only be used as function parameter");
    }
    // 增加执行exec操作指令到params指令数组
    setParamsExecRoutes(exec, func);
  };
};

const Body = (bid?: string): ParameterDecorator => {
  const exec = bid ? `body.value.${bid}` : "body.value";
  // deno-lint-ignore ban-types
  return (target: Object, propertyKey: string | symbol) => {
    const func = Reflect.getOwnPropertyDescriptor(target, propertyKey)?.value as
      | (() => void | Promise<void>)
      | undefined;
    if (!func) {
      throw Error("Query decorator can only be used as function parameter");
    }
    // 增加执行exec操作指令到params指令数组
    setParamsExecRoutes(exec, func);
  };
};

export {
  App,
  ApplyMiddleware,
  Body,
  Middleware,
  Param,
  Prefix,
  Query,
  Route,
  Start,
  StartApplication,
};

export {
  Connect,
  Delete,
  Get,
  Head,
  Options,
  Patch,
  Post,
  Put,
  Trace,
} from "./decorator.method.ts";
