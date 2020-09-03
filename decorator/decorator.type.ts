import {Middleware} from "./middleware.ts";
import {Application} from "./application.ts";
import {Router} from "./router.ts";
import {ListenOptions, Req, Res} from "../model.ts";

export declare type MiddlewareFunc = (req: Req, res: Res, next?: Function) => Promise<unknown> | unknown;

export declare type Entity = {
  app: Application | null,
  router: Router | null,
  server: ListenOptions,
  middleware: Middleware | null,
};
