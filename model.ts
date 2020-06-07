type ModuleFunc = {
  default: Function
}
export interface AppConfig{
  server: ListenOptions
}
export interface RoutesConfig{
  url: string,
  method: string,
  func: string | ModuleFunc
  cors?: CorsOptions
}
export interface MethodMapValue {
  func: Function,
  paramsName?: string,
  dynamicFunc?: Function
  middleWare?: Function[]
}
export interface RouteHandlers{
  url: string,
  middleWare?: Function[],
  handler: Function
}
export interface CorsOptions {
  allowMethods?: string[],
  allowHeaders?: string[],
  origin?: string | Function,
  allowCredentials?: boolean,
  maxAge?: number,
  exposeHeaders?: string[]
}
export interface ListenOptions{
  port: number,
  hostname: string,
  certFile?: string,
  isHttps?: boolean,
  secure?: false,
  keyFile?: string
}
export interface RealUrl {
  url: string,
  query?: { [key: string]: any } | null,
  prefix?: string,
  params?: string | null,
  paramsName?: string,
  extName?: string
}
