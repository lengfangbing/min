import {
  parseResponseCookie
} from "./utils/parse/url.ts";

export class Cookie {
  #cookie: string[]

  constructor() {
    this.#cookie = []
  }

  append(name: string, value: string, options?: Record<string, unknown>){
    let ops = parseResponseCookie(options);
    ops = ops ? ';' + ops : '';
    this.#cookie.push(`${name}=${value}${ops}`)
  }

  getCookies(){
    return this.#cookie;
  }
}
