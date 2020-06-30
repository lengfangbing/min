import {
  Application,
  MiddlewareFunc
}  from './deps.ts';
const app = new Application();
import config from './min.config.ts';
function requestLogger(): MiddlewareFunc{
  return async function(req, res, next){
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
  .use(requestLogger());
await app.start(await import('./min.config.ts'));
// or
// await app.start(config);
