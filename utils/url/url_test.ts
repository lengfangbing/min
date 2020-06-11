import {
  assertEquals
} from "https://deno.land/std/testing/asserts.ts";
import {
  urlDecode
} from "../../deps.ts";

const url = '/homed/api/information/detail/v4';
const url1 = '/homed/api/information/detail/v4/';
const url2 = '/homed/api/information/detail/v4?name=冷方冰&age=22&location=beijing';
const url3 = '/homed/api/information/detail/v4/?name=冷方冰&age=22&location=beijing';
const path = '/homed/api/information/user/v4/:id';
const path1 = '/:userId';

function parseUrlQuery(url: string){
  // 判断是否有query
  const s = url.lastIndexOf('?'); // ?的索引
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

function parseParamsName(url: string){
  const s = url.indexOf(':');
  // 如果url 只有动态params => /:userId
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

function parseParamsValue(url: string){
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
function timeTest(func: Function){
  const time1 = performance.now();
  func.call(null);
  const time2 = performance.now();
  console.log(time2 - time1);
}
function parseExtname(url: string){
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
timeTest(parseUrlQuery.bind(null, url2));
timeTest(parseParamsName.bind(null, path));
timeTest(parseParamsValue.bind(null, url));
timeTest(parseExtname.bind(this, '/static/test.txt'));
assertEquals('/homed/api/information/detail/v4', parseUrlQuery(url1).url);
assertEquals({name: '冷方冰', age: '22', location: 'beijing'}, parseUrlQuery(url3).query);
assertEquals({}, parseUrlQuery(url).query);
assertEquals({url: '/homed/api/information/user/v4', paramsName: 'id'}, parseParamsName(path));
assertEquals({url: '', paramsName: 'userId'}, parseParamsName(path1));
assertEquals({url: '/homed/api/information/detail', params: 'v4'}, parseParamsValue(url));
assertEquals({url: '', params: 'id'}, parseParamsValue('/id'));
assertEquals({url: '/test.txt', extName: '.txt'}, parseExtname('/test.txt'));
assertEquals({url: '/static/test.txt', extName: '.txt'}, parseExtname('/static/test.txt'));
assertEquals({url: '/.txt', extName: '.txt'}, parseExtname('/.txt'));
assertEquals({url: '/test', extName: ''}, parseExtname('/test'));
