import { Min } from "../type.ts";
/**
 * 解析路由路径
 * @param {string} u 需要进行解析的路由路径 need parsed uri
 */
export const parseRouteUri = (u: string) => {
	let fu = String(u);
	while (fu.endsWith('/')) {
		fu = fu.slice(0, fu.length - 1);
	}
	while (fu.startsWith('/')) {
		fu = fu.slice(1);
	}
	return fu.split('/').reduce((p: Min.ParsedRouteUri, c, _index, v: Min.ParsedRouteUri) => {
		if (p.length === 0) {
			v = [];
		}
		if (c.startsWith(':')) {
			v = [...p, { type: 'dynamic', paramName: c.slice(1) }];
		} else if (c.startsWith('*')) {
			v = [...p, { type: 'global', paramName: c.slice(1) }];
		} else {
			v = [...p, c];
		}
		return v;
	}, []);
};