import {
  parseUrlQuery,
  splitPath,
  splitUrl
} from './utils/url/url_test.ts';
import {
  assertEquals
} from "https://deno.land/std/testing/asserts.ts";
export interface RouteValue {
  query: { [key: string]: string }
  url: string
  params: { [key: string]: string },
  handler: Function,
  middleware: Function[]
}
export interface SingleRoute {
  middleware: Function[],
  handler: Function,
  paramsNames: {[key: string]: string }
}
export interface NewRoute {
  next: Record<string, NewRoute> | null
  middleware: Function[]
  handler: Function | null,
  paramsNames: {[key: string]: string }
}

export class Router {
  #tree: Record<string, Record<string, NewRoute>>;

  constructor() {
    this.#tree = {
      get: {},
      post: {},
      put: {},
      delete: {},
      options: {},
      head: {},
      patch: {},
    };
  }

  #findLoop = (map: Record<string, NewRoute | null>, urls: string[]): SingleRoute | null => {
    // 回退查找的数组
    let _map: Function[] = [];
    // 当前查找到的静态处理Route
    let routeVal: NewRoute | null = null;
    // 是否需要回溯
    let needFallback: boolean = false;
    for(let i = 0; i < urls.length; i++) {
      const url = urls[i];
      // 下个节点对象
      let nextNode: any = routeVal ? routeVal.next : map;
      if(nextNode === null){
        for(let i = 0; i < _map.length; i++){
          const res = _map[i]();
          if(res){
            return res;
          }
        }
        return null;
      }
      const stVal = nextNode[url];
      const dyVal = nextNode[''];
      // 静态匹配
      if(stVal){
        routeVal = stVal;
        if(dyVal){
          _map.push(this.#findLoop.bind(this, {'': dyVal}, urls.slice(i)));
        }
      }else{
        // 动态匹配
        if(dyVal){
          routeVal = dyVal;
        }else{
          needFallback = true;
          break;
        }
      }
    }
    if(routeVal){
      const {handler, middleware, paramsNames} = routeVal;
      if(needFallback){
        for(let i = 0; i < _map.length; i++){
          const res = _map[i]();
          if(res){
            return res;
          }
        }
        return null;
      }
      if(handler === null){
        for(let i = 0; i < _map.length; i++){
          const res = _map[i]();
          if(res){
            return res;
          }
        }
        return null;
      }else{
        return {
          handler,
          middleware,
          paramsNames
        };
      }
    }
    return null;
  }

  find(method: string, url: string): RouteValue | null {
    const {url: u, query} = parseUrlQuery(url);
    url = u || '/';
    const funcMap = this.#tree[method];
    const urls = splitUrl(url) as string[];
    const res = this.#findLoop(funcMap, urls);
    if(res === null){
      return null;
    }
    const {paramsNames, middleware, handler} = res;
    const params: {[key: string]: string} = {};
    for (let i in paramsNames){
      params[paramsNames[i]] = urls[+i].substring(1);
    }
    return {
      url,
      query,
      params,
      middleware,
      handler
    }
  }

  add(method: string, url: string, handler: Function, middleware: Function[] = []) {
    const funcMap = this.#tree[method];
    const urls = splitPath(url);
    if (!urls.length) throw new Error('router path is invalid, use /path/... instead');
    let p: NewRoute | null = null;
    let params: {[key: string]: string } | null = null;
    urls.forEach((value: string | { paramsName: string }, index: number) => {
      // 静态路由
      if (typeof value === 'string') {
        // 如果p代表了有值了, 就代表funcMap有匹配项了
        if (p) {
          // 如果p有next, 表示p有下一节点, 接下来判断是否有这个value节点
          if (p.next) {
            if (p.next[value]) {
              p = p.next[value];
            } else {
              p.next[value] = {
                handler: null,
                next: null,
                middleware: [],
                paramsNames: {}
              }
              p = p.next[value];
            }
          } else {
            // 如果没有next, 表示没有下一节点, 这是个新开的节点
            p.next = {
              [value]: {
                handler: null,
                next: null,
                middleware: [],
                paramsNames: {}
              }
            };
            p = p.next[value];
          }
        } else {
          if (funcMap[value]) {
            p = funcMap[value];
          } else {
            funcMap[value] = {
              handler: null,
              next: null,
              middleware: [],
              paramsNames: {}
            };
            p = funcMap[value];
          }
        }
      } else {
        // 动态路由
        // 把所有动态路由都改成''(空字符串)索引的形式构造树
        // 第一个就是动态路由
        if (p === null) {
          if (funcMap['']) {
            p = funcMap[''];
          } else {
            funcMap[''] = {
              handler: null,
              next: null,
              middleware: [],
              paramsNames: {}
            }
            p = funcMap[''];
          }
          if (params) {
            params[index] = value.paramsName;
          } else {
            params = {[index]: value.paramsName};
          }
        } else {
          if (p.next) {
            if (p.next['']) {
              p = p.next[''];
            } else {
              p.next[''] = {
                handler: null,
                next: null,
                middleware: [],
                paramsNames: {}
              }
              p = p.next[''];
            }
            if (params) {
              params[index] = value.paramsName;
            } else {
              params = {[index]: value.paramsName};
            }
          } else {
            p.next = {
              '': {
                handler: null,
                next: null,
                middleware: [],
                paramsNames: {}
              }
            }
            p = p.next[''];
            if (params) {
              params[index] = value.paramsName;
            } else {
              params = {[index]: value.paramsName};
            }
          }
        }
      }
    });
    // @ts-ignore
    p.middleware = middleware;
    // @ts-ignore
    p.handler = handler;
    // @ts-ignore
    p.paramsNames = params;
  }

  getTree() {
    return this.#tree;
  }
}
const router = new Router();
const path1 = '/name/:id/:version/detail';
const url = '/name/2016207235/v1/detail';
router.add('get', path1, () => {
  console.log(path1);
});
// test time used, remember with --allow-hrtime
function timeTest(func: Function){
  const time1 = performance.now();
  func.call(null);
  const time2 = performance.now();
  console.log(time2 - time1);
}
// for example
timeTest(router.find.bind(router, 'get', url));
assertEquals({id: '100', version: 'v1'}, router.find('get', '/name/100/v1/detail/')?.params);
