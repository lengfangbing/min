import { Min } from '../type.ts';
import { assertEquals } from "../deps.ts";
import { Router } from "../router.test.ts";
import { loadRoutes } from "./core.test.ts";
import { Entity } from "./entity.test.ts";
import { Ctx, Get, Middleware, Post, Query, Route, Request } from "./method.test.ts";

Deno.test({
  name: 'method, core, entity cases in once',
  fn() {
    const middleware1 = () => {};
    const middleware2 = () => {};
    const entity = Entity.getInstance();

    @Route("/api")
    class Test {
      @Middleware
      globalMiddle1() {
        console.log("global middleware1");
      }

      @Get("/v1", middleware1, middleware2)
      handler(@Query() _query: unknown, @Query("name") _name: unknown) {
        console.log(_query);
        console.log(_name);
      }

      @Get("/v2")
      handler2(@Query() _query: unknown, @Query("name2") _name: unknown) {
        console.log(_query);
        console.log(_name);
      }

      @Middleware
      globalMiddle2() {
        console.log("global middleware2");
      }
    }

    @Route("/api2")
    class Test2 {
      @Middleware
      globalMiddle1_2() {
        console.log("global middleware1");
      }

      @Get("/v1", middleware1, middleware2)
      handler_2(@Query() _query: unknown, @Query("name") _name: unknown) {
        console.log(_query);
        console.log(_name);
      }

      @Get("/v2")
      handler2_2(@Query() _query: unknown, @Query("name2") _name: unknown) {
        console.log(_query);
        console.log(_name);
      }

      @Middleware
      globalMiddle2_2() {
        console.log("global middleware2");
      }

      @Post("/v3")
      handler3_2(@Ctx _ctx: Min.Application.Ctx, @Request _request: Min.Application.Ctx['request']) {
        console.log(_ctx);
        console.log(_request);
      }
    }

    const test1 = new Test();
    const test2 = new Test2();
    
    assertEquals(entity.getValueByRouteTarget(Test.prototype)?.middleware, [test1.globalMiddle1, test1.globalMiddle2]);
    assertEquals(entity.getValueByRouteTarget(Test2.prototype)?.middleware, [test2.globalMiddle1_2, test2.globalMiddle2_2]);

    assertEquals(entity.getValueByRouteTarget(Test.prototype)?.prefix, '/api');
    assertEquals(entity.getValueByRouteTarget(Test2.prototype)?.prefix, '/api2');

    assertEquals(entity.getValueByRouteTarget(Test.prototype)?.routes.length, 2);
    assertEquals(entity.getValueByRouteTarget(Test2.prototype)?.routes.length, 3);

    loadRoutes();
    const router = Router.getInstance();
    const tree = router.tree();
    assertEquals(tree.GET['api'].next?.['v1'].handler?.name, test1.handler.name);
    assertEquals(tree.GET['api'].next?.['v1'].middleware, [test1.globalMiddle1, test1.globalMiddle2, middleware1, middleware2]);
    assertEquals(tree.GET['api'].next?.['v1'].exec, [['request', 'query'], ['request', 'query', 'name']]);

    assertEquals(tree.GET['api2'].next?.['v2'].handler?.name, test2.handler2_2.name);
    assertEquals(tree.GET['api2'].next?.['v2'].middleware, [test2.globalMiddle1_2, test2.globalMiddle2_2]);
    assertEquals(tree.GET['api2'].next?.['v2'].exec, [['request', 'query'], ['request', 'query', 'name2']]);

    assertEquals(tree.POST['api2'].next?.['v3'].handler?.name, test2.handler3_2.name);
    assertEquals(tree.POST['api2'].next?.['v3'].exec, [[''], ['request']]);
  }
})