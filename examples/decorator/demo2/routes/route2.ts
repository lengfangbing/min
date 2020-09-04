import {Get, Route, Prefix, Middleware, Req, Res} from "../deps.ts";

// to add a new Route in entity
@Route
// to add a prefix for this class's restful api handler
@Prefix('/route2')
class Route2 {
  @Middleware
  async middle (req: Req, res: Res, next: Function) {
    console.log('route2 middle');
    await next();
    console.log('route2 middle end');
  }
  @Get('/test')
  test(req: Req, res: Res) {
    res.body = {
      prefix: '/test2_prefix'
    }
  }
}

export default new Route2();
