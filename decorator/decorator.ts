import {getRouterInitial, setApp, setServer} from "./entity.ts";
import {App} from "./app.ts";
import {Application as OwnApplication} from "./application.ts";
import {ListenOptions, MethodFuncArgument} from "../model.ts";

const StartApplication: ClassDecorator = (target) => {
  setApp(new OwnApplication());
  return target;
}

const Start = (server: ListenOptions): MethodDecorator => {
  setServer(server);
  return (target, propertyKey, descriptor) => {
    return descriptor;
  }
}

const Get = (path: string, ...args: MethodFuncArgument): MethodDecorator => {
  const router = getRouterInitial();
  return function (target, propertyKey, descriptor) {
    // @ts-ignore
    router.get(path, descriptor.value, args);
    return descriptor;
  }
}

export {StartApplication, App, Start, Get};
