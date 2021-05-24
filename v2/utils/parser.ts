import { parse } from "../deps.ts";
import type { Min } from "../type.ts";

/**
 * 格式化uri, 默认导出的格式为a/b/c, format uri, the default return value is a/b/c
 * @param {string} uri 要转换的uri, uri need formatted
 * @param {string} [startSeq] 在默认的格式前面添加的字符, seq add before default uri
 * @param {string} [endSeq]  在默认的格式后面添加的字符, seq append default uri
 */
function formatUri(uri: string, startSeq = "", endSeq = "") {
  let flagUri = String(uri);
  // 对uri进行前后的'/'删除
  while (flagUri.endsWith("/")) {
    flagUri = flagUri.slice(0, flagUri.length - 1);
  }
  while (flagUri.startsWith("/")) {
    flagUri = flagUri.slice(1);
  }
  return `${startSeq}${flagUri}${endSeq}`;
}

function parseRouteUri(uri: string): Array<string>;
function parseRouteUri(uri: string, isRouteParse: boolean): Min.Parser.RouteUri;

/**
 * 解析uri路径
 * @param {string} uri 需要进行解析的路由路径, need parsed uri
 * @param {boolean} isParse4Route 是否是路由uri解析, 如果是false, 则只会split, whether the uri is for route, default false
 */
function parseRouteUri(uri: string, isParse4Route?: boolean) {
  const flagUri = formatUri(uri);
  const splitedUri = flagUri.split("/");
  if (!isParse4Route) {
    return splitedUri;
  }
  return splitedUri.reduce(
    (prev: Min.Parser.RouteUri, curr, _index, arr: Min.Parser.RouteUri) => {
      if (prev.length === 0) {
        arr = [];
      }
      if (curr.startsWith("*")) {
        arr = [...prev, { type: "global", paramName: curr.slice(1) }];
      } else if (curr.startsWith(":")) {
        arr = [...prev, { type: "dynamic", paramName: curr.slice(1) }];
      } else {
        arr = [...prev, curr];
      }
      return arr;
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
  const [originUri, queryString] = uri.split("?");
  return {
    uri: formatUri(originUri, "/"),
    query: queryString ? parse(queryString) as T : {} as T,
  };
}

export { formatUri, parseRouteUri, parseUriAndQuery };
