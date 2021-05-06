import { assertEquals, parse }  from '../deps.ts';
import type { Min } from "../type.ts";

/**
 * 格式化uri, 默认导出的格式为a/b/c, format uri, the default return value is a/b/c
 * @param {string} uri 要转换的uri, uri need formatted
 * @param {string} [startSeq] 在默认的格式前面添加的字符, seq add before default uri
 * @param {string} [endSeq]  在默认的格式后面添加的字符, seq append default uri
 */
function formatUri(uri: string, startSeq = '', endSeq = '') {
	let flagUri = String(uri);
	// 对uri进行前后的'/'删除
	while (flagUri.endsWith('/')) {
		flagUri = flagUri.slice(0, flagUri.length - 1);
	}
	while (flagUri.startsWith('/')) {
		flagUri = flagUri.slice(1);
	}
	return `${startSeq}${flagUri}${endSeq}`;
}

function parseRouteUri(uri: string): Array<string>;
function parseRouteUri(uri: string, isRouteParse: boolean): Min.ParsedRouteUri;
/**
 * 解析uri路径
 * @param {string} uri 需要进行解析的路由路径, need parsed uri
 * @param {boolean} [isRouteParse] 是否是路由uri解析, 如果是false, 则只会split, whether the uri is for route, default false
 */
function parseRouteUri (uri: string, isRouteParse?: boolean) {
	const flagUri = formatUri(uri);
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
		if (curr.startsWith('*')) {
			arr = [...prev, { type: 'global', paramName: curr.slice(1) }];
		} else if (curr.startsWith(':')) {
			arr = [...prev, { type: 'dynamic', paramName: curr.slice(1) }];
		}  else {
			arr = [...prev, curr];
		}
		return arr;
	}, []);
}

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
			['api', 'v1', '*name'],
			parseRouteUri('/api/v1/*name'),
		);
	}
});

Deno.test({
	name: 'parse global route uri test case',
	fn() {
		assertEquals(
			['api', 'v1', { type: 'global', paramName: 'name' }],
			parseRouteUri('/api/v1/*name', true),
		);
	}
});

/**
 * 解析请求的uri和query
 * @param {string} uri 要解析的uri, uri need parsed
 */
function parseUriAndQuery
<T extends Record<string, unknown> = Record<string, unknown>>
(uri: string) {
	const [originUri, queryString = ''] = uri.split('?');
	return {
		uri: formatUri(originUri, '/'),
		query: queryString ? parse(queryString) as T : {} as T,
	};
}

Deno.test({
	name: 'parse uri and query test case1',
	fn() {
		assertEquals(
			{
				uri: '/api/test/v1',
				query: {},
			},
			parseUriAndQuery('/api/test/v1')
		);
	}
});

Deno.test({
	name: 'parse uri and query test case2',
	fn() {
		assertEquals(
			{
				uri: '/api/test/v1',
				query: {},
			},
			parseUriAndQuery('/api/test/v1/')
		);
	}
});

Deno.test({
	name: 'parse uri and query test case3',
	fn() {
		assertEquals(
			{
				uri: '/api/test/v1',
				query: {},
			},
			parseUriAndQuery('/api/test/v1?')
		);
	}
});

Deno.test({
	name: 'parse uri and query test case4',
	fn() {
		assertEquals(
			{
				uri: '/api/test/v1',
				query: {},
			},
			parseUriAndQuery('/api/test/v1/?')
		);
	}
});

Deno.test({
	name: 'parse uri and query test case5',
	fn() {
		assertEquals(
			{
				uri: '/api/test/v1',
				query: {
					name: '123',
					age: '20',

				},
			},
			parseUriAndQuery('/api/test/v1/?name=123&age=20')
		);
	}
});

Deno.test({
	name: 'parse uri and query test case6',
	fn() {
		assertEquals(
			{
				uri: '/api/test/v1',
				query: {
					name: '123',
					age: '20',
					love: ['2017', '2018', '2019', '2020']
				},
			},
			parseUriAndQuery('/api/test/v1/?name=123&age=20&love=2017&love=2018&love=2019&love=2020')
		);
	}
});