
let url = '/homed/api/information/detail/v2';
interface Routes{
  paramsName?: string
  params?: string,
  middleware: Function[],
  handler: Function
}
export class Router{
  #tree: Record<string, Record<string, Routes>>

  constructor() {
    this.#tree = {
      get: {},
      post: {},
      put: {},
      delete: {},
      options: {},
      head: {},
      connect: {},
      trace: {},
      patch: {}
    }
  }

  append(method: string, url: string, middleware: Function[] = [], handler: Function){

  }

  find(method: string, url: string){

  }

}

const time1 = performance.now();
useRegParsePrefixUrl(url);
const time1end = performance.now() - time1;
console.log(time1end);
function useRegParsePrefixUrl(url: string){
  const reg = /(.+)(\/.+)$/i;
  const _e = url.match(reg);
  return _e ? {
    prefix: _e[1],
    detail: _e[2]
  } : null;
}
const time2 = performance.now();
useSplitParsePrefixUrl(url);
const time2end = performance.now() - time2;
console.log(time2end);
function useSplitParsePrefixUrl(url: string){
  const lastIndex = url.lastIndexOf('/');
  if(lastIndex === 0) return null;
  return {
    prefix: url.substring(0, lastIndex),
    detail: url.substring(lastIndex)
  }
}
