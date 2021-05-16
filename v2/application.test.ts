import { serve, ServerRequest, Status, assertEquals } from './deps.ts';
import { Request } from './request.test.ts';
import type { Min } from './type.ts';

// type alias
export type Ctx = Min.Application.Ctx;

const PORT = 3000;
const HOST = '127.0.0.1';

export class Application {
	#DEFAULT_STATUS = Status.NotFound;
	// 创建上下文变量Ctx
	#createCtx = (req: ServerRequest): Ctx => {
		return {
			originRequest: req,
			originResponse: {},
			request: {
				query: {},
        url: req.url,
        params: {},
				method: req.method,
        headers: req.headers,
        // cookie: getCookies(req),
        body: {
					type: 'text',
					value: null,
				},
			},
			response: {
				headers: new Headers(),
				body: '',
				status: this.#DEFAULT_STATUS,
				// cookie: {},
			}
		};
	}
	// start启动, 先看一下req和res然后再进行处理
	async start() {
		const server = serve({
			hostname: HOST,
			port: PORT,
		});

		for await (const request of server) {
			const originRequest = request;
			const ctx = this.#createCtx(originRequest);
			await new Request().handleRequest(ctx);
		}
	}
}

new Application().start();

/**
 * test case
 */

Deno.test({
	name: 'test fetch result',
	async fn() {
		const app = new Application();
		app.start();
		const testResult = await fetch('http://127.0.0.1:3000');
		const testText = await testResult.text();
		assertEquals(testText, 'hello world');
	}
});

Deno.test({
	name: 'test fetch status',
	async fn() {
		const app = new Application();
		app.start();
		const testResult = await fetch('http://127.0.0.1:3000');
		const testText = await testResult.text();
		assertEquals(testResult.status, Status.OK);
	}
});