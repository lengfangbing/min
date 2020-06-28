## introduction
A framework for Deno's http server, combine Koa's middleware and Express's internal feature. If you are used to using Koa or Express, it'll be easy for you~
## Application, Req, Res
### Application
The Application class provides some apis for user. Most use use() to add one middleware async function. Other like get(), post() and ...<br> 
`.use(function: Function)`<br>
add one async function in middleware, it works for global routers;

`.start(config: any)` 
and
`.listen(config: string | ListenOptions)`
```typescript
interface MinConfig{
  server: ListenOptions,
  routes: RoutesConfig[],
  cors?: CorsOptions,
  assets?: string
}
interface ListenOptions {
  port: number,
  hostname: string,
  certFile?: string,
  isHttps?: boolean,
  secure?: boolean,
  keyFile?: string
}
interface CorsOptions {
  allowMethods?: string[],
  allowHeaders?: string[],
  origin?: string | Function,
  allowCredentials?: boolean,
  maxAge?: number,
  exposeHeaders?: string[]
}
interface RoutesConfig {
  url: string,
  method: string,
  func: string | Function
  middleware?: Function[]
}
```
You should provide a config for start function. You can check the demo in ***examples/demo2*** .

`support methods`

* get(...args)
* post(...args)
* put(...args)
* delete(...args)
* options(...args)
* head(...args)
* patch(...args)

args means the first argument is router path, the last argument is router handler, the rest is middleware only for this router
### Req
* `.query`
the url search query -- object
* `.params`
the dynamic router params value -- object
* `.url`
the request url without url search -- string
* `.method`
the request method as lowercase -- string
* `.headers`
the request headers -- Headers
* `.body`
the request body -- Object
* `.request`
the server request -- ServerRequest
* `.cookies`
the request cookie -- Map
### Res
* `.body`
the response body -- any
* `.headers`
the response headers -- Headers
* `.status`
the response status, default set one of these (404, 200, 500) -- number
* `.cookies`
the response cookie -- Map
* `.redirect(url: string)`
respond a status with 301(default), and set Location header in url. -- Function
* `.render(path: string)`
respond a file such as index.html -- AsyncFunction
* `.send(req: Req, res: Res)`
manual respond with the req and res that user provided
## usage
You can find demo in ***examples*** directory .<nr>
