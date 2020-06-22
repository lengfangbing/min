import {
  Application,
  Req,
  Res
}  from './deps.ts';
const app = new Application();

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
  .use(requestLogger());
await app.start(await import('./min.config.ts'));
