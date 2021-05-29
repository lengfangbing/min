import { assertEquals } from '../deps.ts';
import { Min } from '../type.ts';
import { Entity } from './entity.test.ts';

// @TODO 实现中间件的装饰器方法需要修改数据结构

export const Route: ClassDecorator = (_target) => {
  // 执行到这个decorator预示着这个路由资源已经执行完成，需要进行eat进行消费掉
  const value = Entity.getInstance().eatAll(true);
  console.log(value);
};

export const Prefix = (prefix: string): ClassDecorator => {
  const entity = Entity.getInstance();
  // 设置prefix
  entity.setPrefix(prefix);
  return () => {};
};

export const Middleware: MethodDecorator = <T = unknown>(_target: unknown, _propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
  if (typeof descriptor.value === 'function') {
    const entity = Entity.getInstance();
    // 这里先在使用时保证时中间件的类型
    // 设置全局中间件
    entity.setMiddleware(descriptor.value as unknown as Min.Middleware.MiddlewareFunc);
  } else {
    throw new Error('Middleware decorator can only use for function');
  }
  return descriptor;
};

export const Get = (path: string, ...args: Array<Min.Middleware.MiddlewareFunc>): MethodDecorator => {
  const entity = Entity.getInstance();
  const middleware = args as Array<Min.Middleware.MiddlewareFunc>;
  return function <T = unknown>(_target: unknown, _propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) {
    if (typeof descriptor.value === 'function') {
      const handler = descriptor.value as unknown as Min.Router.HandlerFunc;
      // 因为参数装饰器可以拿到这个方法，并且会添加到routes里，所以这里我们需要查找这个handler对应的route
      // 如果找不到就表明这个方法没有参数装饰器
      const findRoute = entity.eatRoutes().find(item => item.handler === handler);
      if (findRoute) {
        // 如果找到了，就修改path，还有middleware
        findRoute.path = path;
        findRoute.middleware = middleware;
      } else {
        // 如果没找到，重新添加一个新的不包含exec的route
        entity.setRoutes({
          path,
          handler,
          exec: [],
          middleware,
        });
      }
    } else {
      throw new Error(`Get method decorator can only use for function, occurred path: ${path}`);
    }
    return descriptor;
  };
};

export const Query = (paramKey?: string): ParameterDecorator => {
  const exec: Array<string> = typeof paramKey === 'string' ? ['request', 'query', paramKey] : ['request', 'query'];
  const entity = Entity.getInstance();
  return (target: unknown, propertyKey: string | symbol, _parameterIndex) => {
    const handler = (target as Record<string, unknown>)[propertyKey as string] as Min.Router.HandlerFunc;
    // 在routes里去查找这个handler，参数装饰器只会修改exec，不会修改其他的routes的参数
    const findRoute = entity.eatRoutes().find(item => item.handler === handler);
    if (findRoute) {
      // 如果找到了这个findRoute，就修改exec，因为解析参数装饰器是倒叙的，所以需要倒叙插入exec
      findRoute.exec.unshift(exec);
    } else {
      // 如果没找到这个findRoute，就添加这个handler的routes，因为handler是没有顺序的，所以直接set就可以
      entity.setRoutes({
        path: '',
        middleware: [],
        exec: [exec],
        handler,
      });
    }
  };
};

// 执行顺序，最内层 - 最外层
// 装饰器只会装饰，不会改变任何值，所以使用必须要保证装饰器执行的顺序

Deno.test({
  name: 'decorator core',
  fn() {
    const entity = Entity.getInstance();
    let flagValue: ReturnType<typeof entity.eatAll> = {
      prefix: '',
      routes: [],
      middleware: [],
    };
    const Route: ClassDecorator = (_target) => {
      // 执行到这个decorator预示着这个路由资源已经执行完成，需要进行eat进行消费掉
      const value = Entity.getInstance().eatAll(true);
      flagValue = value;
    };

    @Route
    @Prefix('/api')
    class Test {
      @Middleware
      globalMiddle1() {
        console.log('global middleware1');
      }

      @Get('/v1', () => {}, () => {})
      handler(@Query() _query: unknown, @Query('name') _name: unknown) {
        console.log(_query);
        console.log(_name);
      }

      @Get('/v2')
      handler2(@Query() _query: unknown, @Query('name2') _name: unknown) {
        console.log(_query);
        console.log(_name);
      }

      @Middleware
      globalMiddle2() {
        console.log('global middleware2');
      }
    }

    new Test();
    assertEquals(flagValue.middleware.length, 2);
    assertEquals(flagValue.prefix, '/api');
    assertEquals(flagValue.routes.length, 2);
    const firstRoute = flagValue.routes[0];
    assertEquals(firstRoute.exec, [['request', 'query'], ['request', 'query', 'name']]);
    assertEquals(firstRoute.path, '/v1');
    assertEquals(firstRoute.middleware.length, 2);
    const secondRoute = flagValue.routes[1];
    assertEquals(secondRoute.exec, [['request', 'query'], ['request', 'query', 'name2']]);
    assertEquals(secondRoute.path, '/v2');
    assertEquals(secondRoute.middleware.length, 0);
    assertEquals(Entity.getInstance().prefix, '');
    assertEquals(Entity.getInstance().routes, []);
    assertEquals(Entity.getInstance().middleware, []);
  },
});