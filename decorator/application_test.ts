import {StartApplication, App, Start, Get} from "./decorator.ts";
import {Req, Res} from "../model.ts";

@StartApplication
export class TestClass extends App  {
  @Get('/test')
  async testHandle(req: Req, res: Res) {
    console.log(req.query);
    res.body = {
      age: 123
    };
  }
  @Get('/id/:id/info')
  async testHandle2(req: Req, res: Res) {
    console.log(req.query);
    console.log(req.params);
    res.body = {
      ...req.params
    };
  }
  @Start({port: 8000, hostname: '127.0.0.1'})
  async start() {
    await this.startServer();
  }
}

const initial = new TestClass();

await initial.start();
