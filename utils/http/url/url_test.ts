import {
  assertEquals
} from "https://deno.land/std/testing/asserts.ts";
import {
  urlDecode
} from "../../../deps.ts";

const url = '/homed/api/information/detail/v4';
const url1 = '/homed/api/information/detail/v4/';
const url3 = '/homed/api/information/detail/v4/?name=冷方冰&age=22&location=beijing';
function timeTest(func: Function){
  const time1 = performance.now();
  func.call(null);
  const time2 = performance.now();
  console.log(time2 - time1);
}
export function parseUrlQuery(url: string){
  // 判断是否有query
  const s = url.indexOf('?'); // ?的索引
  let query = {};
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
export function parseUrlencoded(str: string) {
  return (
    str.length
      ? urlDecode(str)
      : null
  );
}
assertEquals('/homed/api/information/detail/v4', parseUrlQuery(url1).url);
assertEquals({name: '冷方冰', age: '22', location: 'beijing'}, parseUrlQuery(url3).query);
assertEquals({}, parseUrlQuery(url).query);
assertEquals({url: '/test.txt', extName: '.txt'}, parseExtname('/test.txt'));
assertEquals({url: '/static/test.txt', extName: '.txt'}, parseExtname('/static/test.txt'));
assertEquals({url: '/.txt', extName: '.txt'}, parseExtname('/.txt'));
assertEquals({url: '/test', extName: ''}, parseExtname('/test'));

export function splitUrl(url: string){
  const res = [];
  let _url = url.substring(1) || '/';
  let i = 0;
  while((i = _url.indexOf('/')) >= 0){
    const v = _url.substring(0, i);
    res.push(`/${v}`);
    _url = _url.substring(i+1);
  }
  if(_url.length){
    res.push(`/${_url}`);
  }
  return res;
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
declare global{
  interface Map<K,V>{
    toObj: Function
  }
}
Map.prototype.toObj = function () {
  const r: Record<string, any> = {};
  for(let [k, v] of this.entries()){
    r[k] = v;
  }
  return r;
}
export function parseUrlToMap (url: string){
  const res: Map<string, any> = new Map<string, any>();
  let i = -1;
  while((i = url.indexOf(';')) >= 0){
    const str = url.substring(0, i);
    const index = str.indexOf('=');
    if(index < 0){
      res.set(str, true);
    }else{
      res.set(str.substring(0, index), str.substring(index+1));
    }
    url = url.substring(i+1).trim();
  }
  return res;
}
export function parseMapToString (map: Map<any, any>){
  let res = '';
  for(let [k, v] of map.entries()){
    res += typeof v === "boolean"
      ? `${k}; `
      : `${k}=${v}; `;
  }
  return res;
}
export function parseResponseCookie(options?: Record<string, unknown>){
  if (!options) return '';
  let res = [];
  for (let i in options) {
    if(options.hasOwnProperty(i)){
      if (typeof options[i] === 'boolean'){
        if(options[i]) res.push(i);
      }else{
        res.push(`${i}=${options[i]}`);
      }
    }
  }
  return res.join(';');
}
assertEquals('domain=.foo.com;Path=/;secure;httpOnly', parseResponseCookie({domain: '.foo.com', Path: '/', secure: true, httpOnly: true}));
assertEquals('name=123; age; ', parseMapToString(parseUrlToMap('name=123; age; ')));
assertEquals({name: '123', age: true}, parseUrlToMap('name=123; age;').toObj());
assertEquals(['/name', {paramsName: 'id'}, '/v1'], splitPath('/name/:id/v1'));
assertEquals(['/name', '/fangbing', '/v1'], splitUrl('/name/fangbing/v1'));
