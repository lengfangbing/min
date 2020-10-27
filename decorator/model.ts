export interface RouteValue {
  query: Record<string, string>;
  url: string;
  params: Record<string, string>;
  handler: Function;
  middleware: Function[];
  exec: Array<string>;
}

export interface SingleRoute {
  middleware: Function[];
  handler: Function;
  paramsNames: Record<string, string>;
  exec: Array<string>;
}

export interface NewRoute {
  next: Record<string, NewRoute> | null;
  middleware: Function[];
  handler: Function | null;
  paramsNames: Record<string, string>;
  exec: Array<string>;
}
