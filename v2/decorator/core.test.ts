import { assertEquals } from "../deps.ts";
import { Router } from "../router.test.ts";
import { Min } from "../type.ts";

export function setRouteByDecorator(routeValue: {
  prefix: string;
  middleware: Array<Min.Middleware.MiddlewareFunc>;
  routes: Array<{
    path: string;
    middleware: Array<Min.Middleware.MiddlewareFunc>;
    handler: Min.Router.HandlerFunc;
    exec: Array<Array<string>>;
    method: Min.Router.Method;
  }>;
}) {
  const { prefix, middleware, routes } = routeValue;
  // 拿到Router实例
  const router = Router.getInstance();
  // 遍历routes，将每个路由加到router中
  routes.forEach(item => {
    const { path, middleware: ownMiddleware, exec, handler, method } = item;
    const realPath = prefix + path;
    const realMiddleware = middleware.concat(ownMiddleware);
    router.add(method, realPath, handler, realMiddleware, exec);
  });
}

Deno.test({
  name: 'set route by decorator',
  fn() {
    const exec1 = [['request', 'body'], ['request', 'query']];
    const handler1 = () => {};
    const value = {
      prefix: "/api",
      middleware: [() => {}, () => {}],
      routes: [
        {
          path: "/v1",
          middleware: [() => {}, () => {}],
          exec: exec1,
          handler: handler1,
          method: "GET"
        },
        {
          path: "/v2",
          middleware: [] as Array<Min.Middleware.MiddlewareFunc>,
          exec: [],
          handler: () => {},
          method: "POST"
        }
      ]
    } as unknown as Parameters<typeof setRouteByDecorator>[0];
    const router = Router.getInstance();
    setRouteByDecorator(value);
    assertEquals(router.find('/api/v1', 'GET')?.exec, exec1);
    assertEquals(router.find('/api/v1', 'GET')?.handler, handler1);
    assertEquals(router.find('/api/v2', 'GET')?.exec, undefined);
    assertEquals(router.find('/api/v2', 'POST')?.exec.length, 0);
  }
})