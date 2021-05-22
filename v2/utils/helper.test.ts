// 构造header
export function getHeaders(value?: Record<string, string>) {
	const headers = new Headers();
	Object.keys(value || {}).forEach(item => {
		headers.set(item, (value || {})[item]);
	});
	return headers;
}