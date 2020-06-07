import {
  urlDecode
} from "../../deps.ts";

import {
  RealUrl
} from "../../model.ts";

const DYNAMIC_URL_PARSE = /([a-zA-Z0-9\/]+)\/:/g;

export function parseUrlQuery(url: string): RealUrl {
  const res: RealUrl = {
    url: '',
    query: {}
  };
  if (url.includes('?')) {
    const reg = /(\/?\?)(.+)/g;
    let str = '';
    const realUrl = url.replace(reg, function (...args) {
      str = args[2] || '';
      return '';
    });
    if (str) {
      res.url = realUrl;
      res.query = urlDecode(decodeURIComponent(str));
    }
  } else {
    const reg = /\/$/;
    if (reg.test(url)) {
      res.url = url.slice(0, url.length - 1) || '/';
    } else {
      res.url = url;
    }
    res.query = null;
  }
  return res;
}

export function parseDynamicPath(url: string) {
  let realUrl = '';
  const str = url.replace(DYNAMIC_URL_PARSE, function(...args){
    realUrl = args[1];
    return '';
  }) || '';
  return {
    url: realUrl || '',
    paramsName: str
  }
}

export function parseUrl(url: string) {
  const reg = /^((\/.+)+)\/([\d\w]+)$/;
  const res = reg.exec(url);
  return {
    url: res ? res[2] : url,
    params: res ? res[3] : null
  }
}

export function parsePrefixUrl(url: string){
  const reg = /(.+)?\/(.+)$/g;
  const res = reg.exec(url);
  if(!res){
    return null;
  }
  return {
    url,
    prefix: res[1],
    extName: res[2]
  }
}
