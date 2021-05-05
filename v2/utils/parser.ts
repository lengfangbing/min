import { parse }  from '../deps.ts';
import type { Min } from "../type.ts";

/**
 * 格式化uri, 默认导出的格式为a/b/c, format uri, the default return value is a/b/c
 * @param {string} uri 要转换的uri, uri need formatted
 * @param {string} [startSeq] 在默认的格式前面添加的字符, seq add before default uri
 * @param {string} [endSeq]  在默认的格式后面添加的字符, seq append default uri
 */
function formatUri(uri: string, startSeq = "", endSeq = "") {
  let fu = String(uri);
  // 对uri进行前后的'/'删除
  while (fu.endsWith("/")) {
    fu = fu.slice(0, fu.length - 1);
  }
  while (fu.startsWith("/")) {
    fu = fu.slice(1);
  }
  return `${startSeq}${fu}${endSeq}`;
}

function parseRouteUri(uri: string): Array<string>;
function parseRouteUri(uri: string, isRouteParse: boolean): Min.ParsedRouteUri;

/**
 * 解析uri路径
 * @param {string} uri 需要进行解析的路由路径, need parsed uri
 * @param {boolean} isParse4Route 是否是路由uri解析, 如果是false, 则只会split, whether the uri is for route, default false
 */
function parseRouteUri(uri: string, isParse4Route?: boolean) {
  const fu = formatUri(uri);
  const su = fu.split("/");
  if (!isParse4Route) {
    return su;
  }
  return su.reduce(
    (p: Min.ParsedRouteUri, c, _index, v: Min.ParsedRouteUri) => {
      if (p.length === 0) {
        v = [];
      }
      if (c.startsWith("*")) {
        v = [...p, { type: "global", paramName: c.slice(1) }];
      } else if (c.startsWith(":")) {
        v = [...p, { type: "dynamic", paramName: c.slice(1) }];
      } else {
        v = [...p, c];
      }
      return v;
    },
    [],
  );
}

/**
 * 解析请求的uri和query
 * @param {string} uri 要解析的uri, uri need parsed
 */
function parseUriAndQuery<
  T extends Record<string, unknown> = Record<string, unknown>,
>(uri: string) {
  const [ou, qs = ""] = uri.split("?");
  return {
    uri: formatUri(ou, "/"),
    query: qs ? parse(qs) as T : {} as T,
  };
}

export { formatUri, parseRouteUri, parseUriAndQuery };
