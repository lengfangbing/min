import {
  urlDecode
} from "../../../deps.ts";

import {
  RealUrl
} from "../../../model.ts";

export function parseUrlQuery(url: string): RealUrl {
  const s: number = url.lastIndexOf('?');
  let query: {[key: string]: any} = {};
  if(s >= 0) {
    const q = url.substring(s+1);
    url = url.substring(0, s);
    query = urlDecode(q);
  }
  if(url.endsWith('/')){
    url = url.substring(0, url.length-1) || '/';
  }
  return {
    url,
    query
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

export function splitUrl(path: string){
  const res = [];
  let url = path.substring(1) || '/';
  let i = 0;
  while((i = url.indexOf('/')) >= 0){
    const v = url.substring(0, i);
    let j = 0;
    if((j = v.indexOf(':')) >= 0){
      res.push({paramsName: v.substring(j+1)});
    }else{
      res.push(`/${v}`);
    }
    url = url.substring(i+1);
  }
  if(url.length){
    if((i = url.indexOf(':')) >= 0){
      res.push({paramsName: url.substring(i+1)});
    }else{
      res.push(`/${url}`);
    }
  }
  return res;
}
export function parseUrlencoded(str: string) {
  return (
    str.length
      ? urlDecode(str)
      : null
  );
}
export function splitPath(path: string){
  const res = [];
  let url = path.substring(1) || '/';
  let i = 0;
  while((i = url.indexOf('/')) >= 0){
    const v = url.substring(0, i);
    let j = 0;
    if((j = v.indexOf(':')) >= 0){
      res.push({paramsName: v.substring(j+1)});
    }else{
      res.push(`/${v}`);
    }
    url = url.substring(i+1);
  }
  if(url.length){
    if((i = url.indexOf(':')) >= 0){
      res.push({paramsName: url.substring(i+1)});
    }else{
      res.push(`/${url}`);
    }
  }
  return res;
}
