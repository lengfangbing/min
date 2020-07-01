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
the response cookie -- Cookie
* `.redirect(url: string)`
respond a status with 301(default), and set Location header in url. -- Function
* `.render(path: string)`
respond a file such as index.html -- AsyncFunction
* `.send(req: Req, res: Res)`
manual respond with the req and res that user provided
## usage
```typescript
import {
  Application,
  Req,
  Res,
  HandlerFunc,
  MiddlewareFunc
}  from 'https://raw.githubusercontent.com/lengfangbing/min/master/mod.ts';

const app = new Application();

function routerLogger(): MiddlewareFunc{
  return async function(req, res, next){
    const time1 = performance.now();
    await next();
    const time2 = performance.now();
    res.headers.set('router-response-time', (time2 - time1).toString());
  }
}
// if you dont give function return type, just give return function arguments type
function requestLogger(){
  return async function(req: Req, res: Res, next: Function){
    const time1 = performance.now();
    await next();
    const time2 = performance.now();
    res.headers.set('request-response-time', (time2 - time1).toString());
  }
}

app
  .use(async (request, response, next) => {
    console.log(request.url);
    await next();
    console.log(response.body);
  })
  .use(requestLogger())
  .get('/', routerLogger(), (request, response) => {
    response.body = 'hello world';
  })
  .post('/post', async (req, res, next) => {
    console.log(`body is ${req.body}`);
    await next();
  }, (req, res) => {
    res.body = {
      isPost: true,
      requestBody: req.body
    }
  })
  .get('/cookie', (request, response) => {
    // parse cookie to object
    console.log(request.cookies.toObj());
    // name value options
    response.cookies.append('name', 'fangbing', {
      domain: '127.0.0.1',
      secure: true
    });
    response.cookies.append('age', '22', {
      domain: '127.0.0.1',
      httpOnly: true
    });
    response.body = {
      name: 'test-cookie',
      cookies: request.cookies.toObj()
    }
  })
  .get('/render', async (req, res) => {
    // if you want, you could give function arguments type
    await res.render('template/index.html');
  });

await app.listen('http://127.0.0.1:8000');

```

### **You can find more demos in ***examples*** directory .<nr>**
**Now, I am working on automatic import min.config.ts(getting some trouble)<br>
If you are interested in min.config.ts, just look at demo2**
#### **if you have some issues or suggestions, you could contact me**
