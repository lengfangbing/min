# min
## usage
#### 1. start
```typescript
import {
  Application,
  Req,
  Res
}  from 'https://raw.githubusercontent.com/lengfangbing/min/master/mod.ts';

const app = new Application();

app
  .use(async (request: Req, response: Res, nect: Function) => {
    await next();
    console.log(response.body);
  })
  .get('/', (request: Req, response: Res) => {
    response.body = 'hello world';
  });
  
await app.listen('http://127.0.0.1:8000');
// or
// await app.listen({ port: 8000, hostname: '127.0.0.1' })
// for https
// await app.listen({ secure: true, hostname: '127.0.0.1', port: 8000, certFile: '', keyFile: '' });
```

**another way to start Application**
* provide a min.config.ts for app.start()
```typescript
import {
  Application,
  Req,
  Res
} from 'https://raw.githubusercontent.com/lengfangbing/min/master/mod.ts';
import config from './min.config.ts';

const app = new Application();

app
  .use(async (request: Req, response: Res, nect: Function) => {
    await next();
    console.log(response.body);
  })
  .get('/', (request: Req, response: Res) => {
    response.body = 'hello world';
  });
  
await app.start(config);

// ==> min.config.ts
import {
  MinConfig
} from 'https://raw.githubusercontent.com/lengfangbing/min/master/mod.ts';
const index = async (req: Req, res: Res) => {
  await res.render('template/index.html');
};
export default {
  "server": {
    "port": 7000,
    "hostname": "127.0.0.1",
    // certFile: '',
    // keyFile: '',
    // secure: false,
    "addr": "http://127.0.0.1:8000"//(high level than port and hostname)
  },
  "routes": [
    {
      url: '/',
      method: 'get',
      func: index
    },
    {
      url: '/render',
      method: 'get',
      func: '/routes/mock.ts' // it will import this path automatic
    }
  ],
  // cors config
  "cors": {
    "origin": '*',
    "allowMethods": ["get", "post", "options", "put", "delete"],
    "allowHeaders": ["content-type"],
    "maxAge": 0,
    "allowCredentials": false,
    "exposeHeaders": [""]
  },
  // static files config, default working direction
  "assets": "./assets"
} as MinConfig;

// Its not necessary to provide a config file if you promise the min.config.ts is in the root of your working directory.

// If you dont provide a min.config.ts. 
// It will import your working directory contains file named min.config.ts automatic. such as this. 
```
demo(your working directory) (● means a directory)

* assets
* template
* routes <br/>
index.ts <br/>
min.config.ts <br/>
deps.ts

#### 2. middleware
**If youve used koajs, its simple to understand min's middleware**
```typescript
app
  .use(async (request: Req, response: Res, next: Function) => {
    const time = performance.now();
    await next();
    response.headers.set('x-response-time', (performance.now() - time).toString());
  })
  .use(async (request: Req, response: Res, next: Function) => {
    await next();
    response.body = {
      body: response.body,
      code: 200,
      message: "success"
    }
  })
```

**next function means the next middleware**
#### 3. router
```typescript
// for static router
app.get('/', (request: Req, response: Res) => {
  response.render('template/index.html'); // it will read this file automatic
});
```
```typescript
// for dynamic router
app.get('/userInfo/:name', (request: Req, response: Res) => {
  // request.params => { name: "" }
  response.body = request.params;
});
```
```typescript
// for query string router
// if your request is http://127.0.0.1:8000/qs/?name=min&age=22
app.get('/qs', (request: Req, response: Res) => {
  // request.query => { name: "min", age: 0 }
  response.body = request.query;
});
```
```typescript
// for post router which has request body
app.post('/postData', (request: Req, response: Res) => {
  // request.body => { name: "min" }
  response.body = request.body;
});
```
```typescript
// for router which has own middleware
app.get('/ownMiddleware', timeLog(), (request: Req, response: Res) => {
  response.body = request.UTCTime;
});
function timeLog (){
  const timeNow = performance.now();
  return async (request: Req, response: Res, next: Function){
    request.UTCTime = timeNow;
    await next();
  }
}
// if you use own middleware in min.config.ts
// min.config.ts
{
  routes: [
    {
      url: "/getList",
      method: "GET",
      func: "routes/list/index.ts",
      middleware: [timeLog(), timeLog()]
    }
  ]
}
```

**I'm learning Deno. And this is a very simple http server. 
If you find some bugs and have some good ideas. Please create a issue ~. :D**
