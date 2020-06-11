import {
  urlDecode
} from "../../deps.ts";

import {
  RealUrl
} from "../../model.ts";

export function parseUrlQuery(url: string): RealUrl {
  const s: number = url.lastIndexOf('?');
  let query: {[key: string]: any} = {};
  if(s >= 0) {
    const q = url.substring(s+1);
    url = url.substring(0, s);
    query = urlDecode(q);
  }
  if(url.endsWith('/')){
    url = url.substring(0, url.length-1);
  }
  return {
    url,
    query
  }
}

export function parseParamsName(url: string) {
  const s = url.indexOf(':');
  if(s === 1){
    return {
      url: '',
      paramsName: url.substring(s+1)
    }
  }
  return {
    url: url.substring(0, s-1),
    paramsName: url.substring(s+1)
  }
}

export function parseParamsValue(url: string) {
  const s = url.lastIndexOf('/');
  if(s === 0){
    return {
      url: '',
      params: url.substring(1)
    }
  }
  return {
    url: url.substring(0, s),
    params: url.substring(s+1)
  }
}

export function parseExtname(url: string){
  const b = url.lastIndexOf('.');
  if(b < 0){
    return {
      extName: '',
      url
    }
  }
  return {
    url,
    extName: url.substring(b)
  }
}
