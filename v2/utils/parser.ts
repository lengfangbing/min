import { Min } from "../type.ts";

function parseRouteUri(uri: string): Array<string>;
function parseRouteUri(uri: string, isRouteParse: boolean): Min.ParsedRouteUri;

/**
 * 解析uri路径
 * @param {string} uri 需要进行解析的路由路径, need parsed uri
 * @param {boolean} isParse4Route 是否是路由uri解析, 如果是false, 则只会split, whether the uri is for route, default false
 */
function parseRouteUri (uri: string, isParse4Route?: boolean) {
	let fu = String(uri);
	while (fu.endsWith('/')) {
		fu = fu.slice(0, fu.length - 1);
	}
	while (fu.startsWith('/')) {
		fu = fu.slice(1);
	}
	const su = fu.split('/');
	if (!isParse4Route) {
		return su;
	}
	return su.reduce((p: Min.ParsedRouteUri, c, _index, v: Min.ParsedRouteUri) => {
		if (p.length === 0) {
			v = [];
		}
		if (c.startsWith('*')) {
			v = [...p, { type: 'global', paramName: c.slice(1) }];
		} else if (c.startsWith(':')) {
			v = [...p, { type: 'dynamic', paramName: c.slice(1) }];
		} else {
			v = [...p, c];
		}
		return v;
	}, []);
}

export { parseRouteUri };