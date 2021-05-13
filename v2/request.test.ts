import { Router } from './router.test.ts';
import { Status } from './deps.ts';
import type { Min } from './type.ts';

export class Request {
	// 实例化router对象
	readonly router = new Router();
	// 全局中间件
	readonly middleware: Array<Min.Middleware.MiddlewareFunc> = [];
	// 返回请求的处理
	#response = (ctx: Min.Application.Ctx) => {
		// @TODO: 这里因为计划使用json, file, text, error三种方法进行返回, 所以这里要判断返回的类型而不是直接将body返回
		// 这里不对有body的ctx进行设置status, 设置status在json, file, text, error方法内进行
		if (ctx.response.body) {
			// 针对json, file, text, error四种返回体进行判断
		} else {
			ctx.originRequest.respond({
				...ctx.response,
				// 当没有返回体时, code设置为NotFound
				status: Status.NotFound,
			});
		}
	}

	// 针对数组进行顺序的执行
	#composeExecMiddleware = (middle: Array<Min.Middleware.MiddlewareFunc>, handler: Min.Router.HandlerFunc) => {
		// 摘自https://github.com/koajs/compose/blob/25568a36509fefc58914bc2a7600f787b16aa0df/index.js#L19
		// references https://github.com/koajs/compose/blob/25568a36509fefc58914bc2a7600f787b16aa0df/index.js#L19
		return function (ctx: Min.Application.Ctx) {
			// 当前取值的索引
			let index = -1;
			// 默认执行方法
			return dispatch(0);
			async function dispatch(i: number): Promise<void> {
				// 错误检测, 同一个中间件内只能调用一次await next方法
				if (i <= index) {
					return Promise.reject(new Error('next() called multiple times'));
				}
				// 赋值当前取值的索引
				index = i;
				// 取到当前的执行方法
				const fn = middle[i];
				if (i === middle.length) {
					// 最后一个的时候, 因为也会取值next, 这时next会是undefined, 就表示是最后一个了
					await handler();
				}
				// 这里加判断是因为可能是上面的fn最后一个执行下一个方法的next为undefined, 需要结束执行
				// 还可能是取到的方法就是空
				// 如果是空, 直接返回执行结束
				if (!fn) {
					return await void 0;
				}
				try {
					// 这是下一个中间件的方法, 被bind绑定了
					return await fn(ctx, dispatch.bind(null, i + 1));
				} catch (err) {
					return Promise.reject(err)
				}
			}
		}
	}

	// 针对findRoute和ctx进行操作
	#handleRouteCtx = async (route: Min.Router.FindResult, ctx: Min.Application.Ctx) => {
		const { handler, middleware, exec, query, params, url } = route;
		// @TODO: 根据exec构造真正的路由处理方法
		// 赋值ctx
		ctx.request.params = params;
		ctx.request.url = url;
		ctx.request.query = query;
		// 执行完全局的中间件和处理函数
		await this.#composeExecMiddleware(this.middleware, handler);
	}

	// 获取原生req和赋值ctx的request的处理方法
	async handleRequest(ctx: Min.Application.Ctx) {
		// 找到这个url对应的请求
		const findRoute = this.router.find(ctx.request.url, ctx.request.method as Min.Router.Method);
		// 如果找到了这个路由
		if (findRoute) {
			// 等执行完成之后再对ctx进行response操作
			await this.#handleRouteCtx(findRoute, ctx);
		} else {
			// 没找到路由设置status为404
			ctx.response.status = Status.NotFound;
		}
		// 针对ctx进行请求的返回处理
		this.#response(ctx);
	}
}