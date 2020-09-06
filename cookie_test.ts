import {
  parseResponseCookie
} from "./utils/test/url_test.ts";
import {
  assertEquals
} from "https://deno.land/std/testing/asserts.ts";
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

const cookie = new Cookie();
cookie.append('name', 'fangbing', {
  domain: '.foo.com',
  secure: true
});
assertEquals('name=fangbing;domain=.foo.com;secure', cookie.getCookies()[0]);
