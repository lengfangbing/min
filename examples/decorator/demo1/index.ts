import {App, ApplyMiddleware, assets, cors, Get, Middleware, Req, Res, Start, StartApplication} from "./deps.ts";

@StartApplication
export class TestClass extends App {
  @ApplyMiddleware([assets('/static'), cors()])
  @Middleware
  async middle1(req: Req, res: Res, next: Function) {
    console.log('middle1');
    await next();
    console.log('middle1 end');
  }

  @Get('/test')
  async testHandle(req: Req, res: Res) {
    // fetch url `${hostname}:${port}/test/?name=myName&age=20`
    res.cookies.append('name', '123');
    res.cookies.append('age', '22');
    res.body = req.query;
  }

  @Start({port: 8000, hostname: '127.0.0.1'})
  async start() {
    await this.startServer();
  }
}

const initial = new TestClass();

await initial.start();
