import { Min } from "../type.ts";

export const parseRouteUri = (u: string, i?: boolean) => {
	let fu = String(u);
	while (fu.endsWith('/')) {
		fu = fu.slice(0, fu.length - 1);
	}
	while (fu.startsWith('/')) {
		fu = fu.slice(1);
	}
	const su = fu.split('/');
	if (!i) {
		return su;
	}
	return su.reduce((p: Min.ParsedRouteUri, c, _index, v: Min.ParsedRouteUri) => {
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