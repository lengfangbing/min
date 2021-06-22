import { Min } from '../type.ts';

type TargetMapItem = {
  routes: Array<{
    path: string;
    middleware: Array<Min.Middleware.MiddlewareFunc>;
    handler: Min.Router.HandlerFunc;
    exec: Array<Array<string>>;
    method: Min.Router.Method;
  }>;
  // 保存需要的全局中间件
  middleware: Array<Min.Middleware.MiddlewareFunc>;
  // 保存需要的prefix
  prefix: string;
}

const INIT_TARGET_MAP_ITEM = {
  routes: [],
  middleware: [],
  prefix: '',
}

export class Entity {
  static entity: Entity;
  #targetMaps: Map<Record<string, unknown>, TargetMapItem> = new Map();

  static getInstance() {
    if (this.entity) {
      return this.entity;
    }
    return (this.entity = new Entity());
  }

  getValueByRouteTarget(target: unknown) {
    if (typeof target === 'object' && target !== null) {
      return this.#targetMaps.get(target as Record<string, unknown>);
    }

    return void 0;
  }

  setValueByRouteTarget(target: unknown, values?: Partial<TargetMapItem>) {
    let realTarget: Record<string, unknown> | void = void 0;
    // 因为类装饰器的target是方法，而方法等装饰器的target是该方法的prototype，所以这里判断一下
    if (typeof target === 'function') {
      realTarget = target.prototype;
    } else if (typeof target === 'object' && target !== null) {
      realTarget = target as Record<string, unknown>;
    }
    if (realTarget) {
      if (this.#targetMaps.has(realTarget)) {
        // 如果存在这一项target， 那么只需要更新这一项的值
        const targetValue = this.#targetMaps.get(realTarget) as TargetMapItem;
        // 存在target并且存在values时才是正常的加载路由流程
        if (values) {
          // 重新定义这个路由对应的数据
          if (values.middleware) {
            targetValue.middleware = targetValue.middleware.concat(values.middleware);
          }
          if (values.prefix) {
            targetValue.prefix = values.prefix;
          }
          if (values.routes) {
            targetValue.routes = targetValue.routes.concat(values.routes);
          }
        }
      } else {
        // 如果不存在这个target，那么需要新建这一个target
        this.#targetMaps.set(realTarget, {
          ...INIT_TARGET_MAP_ITEM,
          ...values,
        });
      }
    }
  }

  getTargetMaps() {
    return this.#targetMaps;
  }

  setPrefix(target: unknown, prefix: string) {
    this.setValueByRouteTarget(target, { prefix });
  }

  getRoutes(target: unknown) {
    if (typeof target === 'object' && target !== null) {
      return this.#targetMaps.get(target as Record<string, unknown>)?.routes;
    }

    return void 0;
  }

  setRoutes(target: unknown, route: {
    path: string;
    middleware: Array<Min.Middleware.MiddlewareFunc>;
    handler: Min.Router.HandlerFunc;
    exec: Array<Array<string>>;
    method: Min.Router.Method;
  }) {
    this.setValueByRouteTarget(target, { routes: [route] });
  }

  setMiddleware(target: unknown, middleware: Min.Middleware.MiddlewareFunc) {
    this.setValueByRouteTarget(target, { middleware: [middleware] });
  }
}

Deno.test({
  name: 'entity core',
  fn() {
    console.log('entity test case moved to test_case.test.ts');
  },
});