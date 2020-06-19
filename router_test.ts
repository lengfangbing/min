import {parseUrlQuery, splitPath, splitUrl} from './utils/url/url_test.ts';

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
  params: {[key: string]: string}
}
export interface NewRoute {
  next: Record<string, NewRoute> | null
  middleware: Function[]
  handler: Function | null,
  paramsNames: string[] | null
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

  #findLoop = (map: Record<string, NewRoute>, urls: any[]): null | SingleRoute => {
    let staticVal: NewRoute | null = null;
    let fallbackVal: Record<string, NewRoute> | null = null;
    let paramsValue: string[] = [];
    try{
      urls.forEach((value: string, index) => {
        // 如果第一次处理到staticVal
        if(staticVal === null){
          // 如果有静态路由匹配
          if(map[value]){
            staticVal = map[value];

            // 处理回退对象 fallbackVal
          }else{
            // 如果没有静态路由匹配成功
            const dyVal1 = map[''];
            // 也没有定义动态路由, 就肯定没有匹配项, 直接抛出null
            if(!dyVal1){
              throw('no');
            }
            staticVal = dyVal1;

            // 处理回退对象 fallbackVal
            paramsValue.push(value.substring(1));
          }
        }else{
          // 不是第一次处理到staticVal
          // 如果都没有下个节点, url没处理完, 直接抛出null
          if(staticVal.next === null){
            throw('no');
          }else{
            // 如果存在下个节点, 判断是否是静态匹配
            const nextNode = staticVal.next[value];
            // 如果存在静态匹配, (这里很重要, 因为有可能这个查找的Url实际是动态路由的一部分)
            if(nextNode){
              // staticVal指向下个静态节点
              staticVal = nextNode;

              //处理回退对象 fallbackVal
            } else {
              // 不存在静态匹配, 可能是动态路由
              // 如果存在动态匹配项
              const nextNode = staticVal.next[''];
              if(nextNode){
                // 重新赋值主匹配项
                staticVal = nextNode;
                // 设置params的value
                paramsValue.push(value.substring(1));
              } else {
                // 如果不存在动态匹配项
                throw('no');
              }
            }
          }
        }
      });
      // 查找完毕
      if(staticVal){
        const {handler, middleware, paramsNames} = staticVal;
        // 如果找到的没有匹配成功的处理函数, 意味着没有定义这个路由处理
        if(handler === null){
          // (重点, 需要设置回溯查找)
          return null;
        }else{
          // 如果找到了匹配项的处理方法, 意味着定义了这个路由处理
          const p: string[] = paramsNames || [];
          // 判断params所有取值的数组长度是否相等
          if(p.length !== paramsValue.length){
            return null;
          } else {
            // 处理params
            const params: {[key: string]: string} = {};
            p.forEach((value:string, index:number) => {
              params[value] = paramsValue[index];
            });
            return {
              handler,
              middleware,
              params
            }
          }
        }
      }else{
        return null;
      }
    }catch (e) {
      if(e === 'no'){
        return null;
      }
    }
    return null;
  }

  find(method: string, url: string): RouteValue | null {
    const {url: u, query} = parseUrlQuery(url);
    url = u || '/';
    const funcMap = this.#tree[method];
    const urls = splitUrl(url);
    const res = this.#findLoop(funcMap, urls);
    if(res === null){
      return null;
    }
    const {params, middleware, handler} = res;
    return {
      url,
      query,
      params,
      middleware,
      handler
    }
  }

  add(method: string, url: string, handler: Function, middleware: Function[]) {
    const funcMap = this.#tree[method];
    const urls = splitPath(url);
    if (!urls.length) throw new Error('router path is invalid, use /path/... instead');
    let p: NewRoute | null = null;
    let params: string[] | null = null;
    urls.forEach((value: string | { paramsName: string }) => {
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
                paramsNames: null
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
                paramsNames: null
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
              paramsNames: null
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
              paramsNames: null
            }
            p = funcMap[''];
          }
          if (params) {
            params.push(value.paramsName);
          } else {
            params = [value.paramsName];
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
                paramsNames: null
              }
              p = p.next[''];
            }
            if (params) {
              params.push(value.paramsName);
            } else {
              params = [value.paramsName];
            }
          } else {
            p.next = {
              '': {
                handler: null,
                next: null,
                middleware: [],
                paramsNames: null
              }
            }
            p = p.next[''];
            if (params) {
              params.push(value.paramsName);
            } else {
              params = [value.paramsName];
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
const path1 = '/';
const path2 = '/:id';
const path3 = '/:id/user/:name';
const path4 = '/name';
const path5 = '/name/user/fang/bing';
const path6 = '/name/user/fang/fang';
const path7 = '/name/:id';
const path8 = '/name/:id/detail';
const path9 = '/2016207235/user/fangbing';
const path = [path1, path2, path3, path4, path5, path6, path7, path8, path9];
const url = '/name';
new Array(9).fill(1).forEach((value: any, index: number) => {
  router.add('get', path[index], () => {
    console.log(index)
  }, []);
});
// console.log(router.getTree()['get']['/name'].next);
// router.find('get', url)
console.log(router.find('get', url));
// router.find('get', url)?.handler();

// router.add('get', path3, () => {
// }, []);
// @ts-ignore
// console.log(router.getTree()['get']['/name'].next['/user'].next);
// console.log(router.getTree()['get'][''].next['/user'].next);
// const count = 9000;
// const a = new Array(count).fill(1);
// a.forEach((value, index) => {
//   router.add('get', `/getList${index}/user/:id/v1/`, () => console.log(`get /getList${index}`), [])
// });
// router.add('get', path1, () => {console.log(`get ${path1}`)}, []);
// router.add('get', path2, () => {console.log(`get ${path2}`)}, []);
// router.add('get', path3, () => {console.log(`get ${path3}`)}, []);
// router.add('get', path4, () => {console.log(`get ${path4}`)}, []);
// router.add('get', path5, () => {console.log(`get ${path5}`)}, []);
// router.add('get', path6, () => {console.log(`get ${path6}`)}, []);
// router.add('get', path7, () => {console.log(`get ${path7}`)}, []);
// const url = '/name/user/detail?name=123&ligr=fsgrhr52534534gtrh;%27;.erte';
// // console.log(router.getTree()['get']);
// timeTest(router.find.bind(router, 'get', url));
// console.log(router.find('get', url));
// router.find('get', url)?.handler();
// // // router.find('get', url);
// function timeTest(func: Function){
//   const time1 = performance.now();
//   func.call(null);
//   const time2 = performance.now();
//   console.log(time2 - time1);
// }
