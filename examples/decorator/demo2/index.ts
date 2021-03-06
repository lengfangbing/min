import {
  App,
  ApplyMiddleware,
  assets,
  cors,
  Get,
  Middleware,
  Post,
  Put,
  Start,
  StartApplication,
} from "./deps.ts";
import type { NextFunc, Req, Res } from "./deps.ts";

// will emit a http server in entity
@StartApplication
export class TestClass extends App {
  // ApplyMiddleware is to add third middleware func
  @ApplyMiddleware([assets("/static"), cors()])
  // use own middleware
  @Middleware
  async middle1(req: Req, res: Res, next: NextFunc) {
    console.log("middle1");
    await next();
    console.log("middle1 end");
  }

  @Middleware
  async middle2(req: Req, res: Res, next: NextFunc) {
    console.log("middle2");
    await next();
    console.log("middle2 end");
  }

  // in @StartApplication class middleware will work for global
  // but in @Route class , it will only work for that Route

  @Get("/id/:id/info", [async (req: Req, res: Res, next: NextFunc) => {
    console.log(`I am a middleware func in ${req.url}`);
    await next();
  }])
  async testHandle2(req: Req, res: Res) {
    console.log(req.query);
    console.log(req.params);
    res.body = {
      ...req.params,
    };
  }

  @Put("/hhh")
  r(req: Req, res: Res) {
    console.log("put /hhh");
    res.body = {
      method: "put",
    };
  }

  @Post("/login", [async (req: Req, res: Res, next: NextFunc) => {
    console.log("I will execute in post request with url /login");
    await next();
  }])
  login(req: Req, res: Res) {
    console.log(req.body);
    res.body = {
      body: req.body.value,
    };
  }

  // to register a server config
  @Start({ port: 8000, hostname: "127.0.0.1" })
  async start() {
    await this.startServer();
  }
}

const initial = new TestClass();

// the order about import is related to middlewares' order
// add another Route class
await import("./routes/route1.ts");
await import("./routes/route2.ts");

await initial.start();
