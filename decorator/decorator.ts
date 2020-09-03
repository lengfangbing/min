import {getRouter, setApp, setRouter, setServer} from "./entity.ts";
import {App} from "./App.ts";
import {Application as OwnApplication} from "./application.ts";
import {Router} from "./router.ts";
import {MiddlewareFunc, ServerConfig} from "./lib.min.d.ts";

const Application: ClassDecorator = (target) => {
  setApp(new OwnApplication());
  return target;
}

const Start = (server: ServerConfig): MethodDecorator => {
  setServer(server);
  return (target, propertyKey, descriptor) => {
    return descriptor;
  }
}

const Get = (path: string, ...args: MiddlewareFunc[]): MethodDecorator => {
  let router = getRouter();
  return function (target, propertyKey, descriptor) {
    if (router === null) {
      setRouter(new Router());
    }
    router = getRouter();
    router.get(path, descriptor.value, args);
    return descriptor;
  }
}

export {Application, App, Start, Get};
