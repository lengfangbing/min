import { urlDecode } from "../../deps.ts";
import { RealUrl } from "../../model.ts";
declare global {
  interface Map<K, V> {
    toObj: () => Record<string, string>;
  }
}
Map.prototype.toObj = function () {
  const r: Record<string, string> = {};
  for (const [k, v] of this.entries()) {
    r[k.trim()] = v;
  }
  return r;
};
export function parseUrlQuery(url: string): RealUrl {
  const s: number = url.lastIndexOf("?");
  let query: { [key: string]: string } = {};
  if (s >= 0) {
    const q = url.substring(s + 1);
    url = url.substring(0, s);
    query = urlDecode(q) as {[key: string]: string};
  }
  if (url.endsWith("/")) {
    url = url.substring(0, url.length - 1) || "/";
  }
  return {
    url,
    query,
  };
}
export function parseExtname(url: string) {
  const b = url.lastIndexOf(".");
  if (b < 0) {
    return {
      extName: "",
      url,
    };
  }
  return {
    url,
    extName: url.substring(b),
  };
}
export function splitUrl(path: string) {
  const res = [];
  let url = path.substring(1) || "/";
  let i = 0;
  while ((i = url.indexOf("/")) >= 0) {
    const v = url.substring(0, i);
    res.push(`/${v}`);
    url = url.substring(i + 1);
  }
  if (url.length) {
    res.push(`/${url}`);
  }
  return res;
}
export function parseUrlencoded(str: string) {
  return (
    str.length ? urlDecode(str) : null
  );
}
export function splitPath(path: string) {
  const res = [];
  let url = path.substring(1) || "/";
  let i = 0;
  while ((i = url.indexOf("/")) >= 0) {
    const v = url.substring(0, i);
    let j = 0;
    if ((j = v.indexOf(":")) >= 0) {
      res.push({ key: "", paramsName: v.substring(j + 1) });
    } else {
      res.push(`/${v}`);
    }
    url = url.substring(i + 1);
  }
  if (url.length) {
    if ((i = url.indexOf(":")) >= 0) {
      res.push({ key: "", paramsName: url.substring(i + 1) });
    } else {
      res.push(`/${url}`);
    }
  }
  return res;
}
export function parseQsToMap(url: string) {
  const r: Map<string, string | boolean> = new Map<string, string | boolean>();
  if (url === null) {
    return r;
  }
  url = url.trim();
  if (!url.endsWith(";")) url += ";";
  if (!url) return r;
  let i = -1;
  while ((i = url.indexOf(";")) > 0) {
    const s = url.substring(0, i);
    const j = s.indexOf("=");
    if (j < 0) {
      r.set(s, true);
    } else {
      r.set(s.substring(0, j), s.substring(j + 1));
    }
    url = url.substring(i + 1).trim();
  }
  return r;
}
export function parseResponseCookie(options?: Record<string, unknown>) {
  if (!options) return "";
  const res = [];
  for (const i in options) {
    if (Object.prototype.hasOwnProperty.call(options, i)) {
      if (typeof options[i] === "boolean") {
        res.push(i);
      } else {
        res.push(`${i}=${options[i]}`);
      }
    }
  }
  return res.join(";");
}
