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
import { ListenOptions, MethodFuncArgument } from "../model.ts";

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

const Middleware: MethodDecorator = (
  target,
  propertyKey,
  descriptor: TypedPropertyDescriptor<any>,
) => {
  setMiddlewares(descriptor.value);
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
  return (target, propertyKey, descriptor) => {
    return descriptor;
  };
};

const Query = (qid?: string): ParameterDecorator => {
  const exec = qid ? `query.${qid}` : "query";
  return (target: any, propertyKey: string | symbol) => {
    const func = Reflect.getOwnPropertyDescriptor(target, propertyKey)?.value as
      | Function
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
  Middleware,
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
