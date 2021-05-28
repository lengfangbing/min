import { Min } from '../type.ts';

export class Entity {
  static entity: Entity;
  // "订阅"的所有handler的数组, 最后进行统一"消费"
  routes: Array<{
    path: string;
    middleware: Array<Min.Middleware.MiddlewareFunc>;
    handler: Min.Router.HandlerFunc;
    exec: Array<Array<string>>;
  }> = [];
  // 保存需要的全局中间件
  middleware: Array<Min.Middleware.MiddlewareFunc> = [];
  // 保存需要的prefix
  prefix: string = '';

  static getInstance() {
    if (this.entity) {
      return this.entity;
    }
    return (this.entity = new Entity());
  }

  setRoutes(route: {
    path: string;
    middleware: Array<Min.Middleware.MiddlewareFunc>;
    handler: Min.Router.HandlerFunc;
    exec: Array<Array<string>>;
  }) {
    this.routes.push(route);
  }

  eatRoutes(clear?: boolean) {
    try {
      return this.routes;
    } finally {
      if (clear) {
        this.routes = [];
      }
    }
  }

  setMiddleware(middleware: Min.Middleware.MiddlewareFunc) {
    this.middleware.push(middleware);
  }

  eatMiddleware(clear?: boolean) {
    try {
      return this.middleware;
    } finally {
      if (clear) {
        this.middleware = [];
      }
    }
  }

  setPrefix(prefix: string) {
    this.prefix = prefix;
  }

  eatPrefix(clear?: boolean) {
    try {
      return this.prefix;
    } finally {
      if (clear) {
        this.prefix = '';
      }
    }
  }

  eatAll(clear?: boolean) {
    try {
      return {
        prefix: this.prefix,
        middleware: this.middleware,
        routes: this.routes,
      };
    } finally {
      if (clear) {
        this.eatPrefix(true);
        this.eatMiddleware(true);
        this.eatRoutes(true);
      }
    }
  }
}