import { Get, Middleware, Route } from "../deps.ts";
import type {
  Req,
  Res,
  NextFunc,
} from '../deps.ts';

// to add a new Route in entity
@Route
class Route1 {
  @Middleware
  // this middleware will only work for this Route
  async middle3(req: Req, res: Res, next: NextFunc) {
    console.log("route1 middle");
    await next();
    console.log("route1 middle end");
  }
  @Get("/test", [async (req: Req, res: Res, next: NextFunc) => {
    console.log("route1 middle for /test");
    await next();
  }])
  test(req: Req, res: Res) {
    res.body = {
      url: "route1 test",
    };
  }
}

export default new Route1();
