import { assertEquals } from '../deps.ts';
import { Min } from '../type.ts';
import { getValueWithCtx } from './reflect.test.ts';

export type DecoratorHandlerGetterConfig = {
  // 要执行的方法
  handler: (...args: unknown[]) => void | Promise<void>;
  // 反射的值的list
  exec?: Min.Router.FindResult['exec'];
  // 如果是中间件传的next方法
  next?: Min.Middleware.MiddlewareFunc;
};

export type DecoratorHandler = (...args: unknown[]) => void | Promise<void>;

/**
 * 根据handler, exec构造真正的装饰器装饰后的执行方法, 如果有next, 则是构造真正的装饰器装饰后的中间件方法
 * @param {DecoratorHandlerGetterConfig} config - 构造装饰后的方法需要的依赖参数
 * @param {Min.Application.Ctx} ctx
 */
export function getDecoratorHandler<T extends DecoratorHandler>(config: DecoratorHandlerGetterConfig, ctx: Min.Application.Ctx): T {
  const { handler, exec, next } = config;
  let realHandler = handler;
  // 如果存在exec, 遍历反射值，然后bind参数形成真正的执行方法
  if (exec) {
    exec.forEach(item => {
      // @TODO 待增加反射规则, 根据反射规则获取到值然后bind到realHandler上
      realHandler = realHandler.bind(null, getValueWithCtx(ctx, item));
    });
  }
  // 如果存在中间件的next, 则表示这是个中间件, 附加到最后
  if (next) {
    realHandler = realHandler.bind(null, next);
  }
  // @TODO 待确定是否需要最后始终绑定上ctx
  realHandler = realHandler.bind(null, ctx);
  return realHandler as T;
}

Deno.test({
  name: 'get real decorator handler',
  fn() {
    const ctx = {
      request: {
        query: {},
        body: {
          type: 'json',
          value: {
            name: 'lfb',
            age: 24,
          },
        },
      },
    } as Min.Application.Ctx;
    const exec = [['request'], ['request', 'body']];
    const handler = ((_a: Record<string, unknown>, _b: Record<string, unknown>) => {
      _a['query'] = null;
      _b['value'] = null;
    }) as Min.Router.HandlerFunc;
    const realHandler = getDecoratorHandler({ exec, handler }, ctx);
    realHandler();
    assertEquals(ctx.request.query, null);
    assertEquals(ctx.request.body.value, null);
  },
});