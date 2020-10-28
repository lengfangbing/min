import {
  App,
  ApplyMiddleware,
  assets,
  cors,
  Get,
  Middleware,
  Query,
  Req,
  Res,
  Start,
  StartApplication,
} from "./deps.ts";

@StartApplication
export class TestClass extends App {
  @ApplyMiddleware([assets("/static"), cors()])
  @Middleware
  async middle1(req: Req, res: Res, next: Function) {
    console.log("middle1");
    await next();
    console.log("middle1 end");
  }

  @Get("/test2")
  async queryHandler(
    @Query("id") id: string,
    @Query("name") name: string,
    res: Res,
    req: Req,
  ) {
    console.log(id);
    console.log(name);
    console.log(req.query);
    res.body = {
      path: "test2",
    };
  }

  @Get("/test3")
  async queryHandler2(
    @Query() query: { id: string; name: string },
    res: Res,
    req: Req,
  ) {
    console.log(query);
    console.log(req.url);
    res.body = {
      path: "test3",
    };
  }

  @Get("/test")
  async testHandle(req: Req, res: Res) {
    res.cookies.append("name", "123");
    res.cookies.append("age", "22");
    res.body = req.query;
  }

  @Start({ port: 8000, hostname: "127.0.0.1" })
  async start() {
    await this.startServer();
  }
}

const initial = new TestClass();

await initial.start();
