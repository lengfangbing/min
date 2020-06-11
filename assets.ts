import {
  Req,
  Res
} from "./http.ts";
import {
  join,
  lookup,
  Status,
  contentType,
  extname
} from "./deps.ts";
import {
  parseExtname
} from "./utils/url/url.ts";
import {
  decoder
} from "./request.ts";
import {
  AssetsOptions
} from "./model.ts";

const defaultOptions = {}

export function assets(root: string, opts?: AssetsOptions) {
  opts = Object.assign({}, defaultOptions, opts || {});
  const path = join(Deno.cwd(), root);
  return async function (request: Req, response: Res, next: Function) {
    // 静态资源
    const {extName, url} = parseExtname(request.url);
    if (extName) {
      const responseType = lookup(extName);
      try {
        if(responseType){
          const filePath = join(path, url);
          const type = contentType(extname(filePath)) || 'text/plain; charset=utf-8';
          response.body = decoder.decode(await Deno.readFile(filePath));
          response.status = Status.OK;
          response.headers.set('content-type', type);
          response.send(request, response);
        }else{
          await next();
        }
      } catch (e) {
        console.log(e);
      }
    }else{
      await next();
    }
  }
}
