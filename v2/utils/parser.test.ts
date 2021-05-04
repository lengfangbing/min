import { assertEquals }  from '../deps.ts';
import { Min } from "../type.ts";
/**
 * 解析uri路径
 * @param {string} uri 需要进行解析的路由路径, need parsed uri
 * @param {boolean} isRouteParse 是否是路由uri解析, 如果是false, 则只会split, whether the uri is for route, default false
 */
const parseRouteUri = (uri: string, isRouteParse?: boolean) => {
	let flagUri = String(uri);
	// 对uri进行前后的'/'删除
	while (flagUri.endsWith('/')) {
		flagUri = flagUri.slice(0, flagUri.length - 1);
	}
	while (flagUri.startsWith('/')) {
		flagUri = flagUri.slice(1);
	}
	const splitedUri = flagUri.split('/');
	// 如果不是路由uri解析, 是普通的请求uri解析
	if (!isRouteParse) {
		return splitedUri;
	}
	// 构造解析后的uri数组
	return splitedUri.reduce((prev: Min.ParsedRouteUri, curr, _index, arr: Min.ParsedRouteUri) => {
		if (prev.length === 0) {
			arr = [];
		}
		if (curr.startsWith(':')) {
			arr = [...prev, { type: 'dynamic', paramName: curr.slice(1) }];
		} else if (curr.startsWith('*')) {
			arr = [...prev, { type: 'global', paramName: curr.slice(1) }];
		} else {
			arr = [...prev, curr];
		}
		return arr;
	}, []);
};

Deno.test({
	name: 'parse single request uri test case',
	fn() {
		assertEquals(
			['api', 'v1', 'test'],
			parseRouteUri('api/v1/test'),
		);
	}
});

Deno.test({
	name: 'parse single route uri test case',
	fn() {
		assertEquals(
			['api', 'v1', 'test'],
			parseRouteUri('api/v1/test', true),
		);
	}
});

Deno.test({
	name: 'parse dynamic request uri test case',
	fn() {
		assertEquals(
			['api', 'v1', ':test'],
			parseRouteUri('/api/v1/:test'),
		);
	}
});

Deno.test({
	name: 'parse dynamic route uri test case',
	fn() {
		assertEquals(
			['api', 'v1', { type: 'dynamic', paramName: 'test' }],
			parseRouteUri('/api/v1/:test', true),
		);
	}
});

Deno.test({
	name: 'parse global request uri test case',
	fn() {
		assertEquals(
			['api', 'v1', '*'],
			parseRouteUri('/api/v1/*'),
		);
	}
});

Deno.test({
	name: 'parse global route uri test case',
	fn() {
		assertEquals(
			['api', 'v1', { type: 'global', paramName: '' }],
			parseRouteUri('/api/v1/*', true),
		);
	}
});