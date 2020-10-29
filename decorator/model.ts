import { HandlerFunc, MethodFuncArgument } from "../model.ts";

export interface RouteValue {
  query: Record<string, string>;
  url: string;
  params: Record<string, string>;
  handler: HandlerFunc;
  middleware: MethodFuncArgument;
  exec: Array<string>;
}

export interface SingleRoute {
  middleware: MethodFuncArgument;
  handler: HandlerFunc;
  paramsNames: Record<string, string>;
  exec: Array<string>;
}

export interface NewRoute {
  next: Record<string, NewRoute> | null;
  middleware: MethodFuncArgument;
  handler: HandlerFunc | null;
  paramsNames: Record<string, string>;
  exec: Array<string>;
}
