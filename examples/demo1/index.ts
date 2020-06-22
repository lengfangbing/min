import {
  Application,
  Req,
  Res
}  from './deps.ts';

const app = new Application();

function routerLogger(){
  return async function(req: Req, res: Res, next: Function){
    const time1 = performance.now();
    await next();
    const time2 = performance.now();
    res.headers.set('router-response-time', (time2 - time1).toString());
  }
}
function requestLogger(){
  return async function(req: Req, res: Res, next: Function){
    const time1 = performance.now();
    await next();
    const time2 = performance.now();
    res.headers.set('request-response-time', (time2 - time1).toString());
  }
}

app
  .use(async (request: Req, response: Res, next: Function) => {
    console.log(request.url);
    await next();
    console.log(response.body);
  })
  .use(requestLogger())
  .get('/', routerLogger(), (request: Req, response: Res) => {
    response.body = 'hello world';
  })
  .get('/render', async (req: Req, res: Res) => {
    await res.render('template/index.html');
  });

await app.listen('http://127.0.0.1:8000');
