import {Get, Route, Middleware, Req, Res} from "../deps.ts";

// to add a new Route in entity
@Route
class Route1 {
  @Middleware
  async middle3(req: Req, res: Res, next: Function) {
    console.log('route1 middle');
    await next();
    console.log('route1 middle end');
  }
  @Get('/test')
  test(req: Req, res: Res) {
    res.body = {
      prefix: '/test_prefix'
    }
  }
}

export default new Route1();
