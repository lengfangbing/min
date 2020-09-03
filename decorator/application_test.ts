import {Application, App, Start, Get} from "./decorator.ts";

@Application
export class TestClass extends App  {
  @Get('/test')
  async testHandle(req: any, res: any) {

  }
  @Start({port: 8000, hostname: '127.0.0.1'})
  async start() {
    await this.startServer();
  }
}

const initial = new TestClass();

await initial.start();
