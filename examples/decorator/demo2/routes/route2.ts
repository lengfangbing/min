import { Get, Middleware, Prefix, Route } from "../deps.ts";
import type { NextFunc, Req, Res } from "../deps.ts";

// to add a new Route in entity
@Route
// to add a prefix for this class's restful api handler
@Prefix("/route2")
class Route2 {
  @Middleware
  // this middleware will only work for this Route
  async middle(req: Req, res: Res, next: NextFunc) {
    console.log("route2 middle");
    await next();
    console.log("route2 middle end");
  }
  @Get("/test", [async (req: Req, res: Res, next: NextFunc) => {
    console.log("route2 middle for /test");
    await next();
  }])
  test(req: Req, res: Res) {
    res.body = {
      prefix: "/route2",
    };
  }
}

export default new Route2();
