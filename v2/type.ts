export declare namespace Min {
	// 路由路径解析后的值, value parsed route uri
	type ParsedRouteUri = Array<
	string
	| {
		type: ParsedRouteUriType;
		paramName: string;
	}>;
	// 路由路径解析复杂类型的类型, type parsed route uri to check this is a dynamic(:) route or global(*) route
	type ParsedRouteUriType = 'dynamic' | 'global';
}