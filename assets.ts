import {
  Req,
  Res
} from "./http.ts";
import {
  join,
  lookup,
  Status,
  charset
} from "./deps.ts";
import {
  parsePrefixUrl
} from "./utils/url/url.ts";
import {
  decoder
} from "./bodyParser.ts";
import {
  send
} from "./response.ts";
interface Options {

}

const defaultOptions = {}

export function assets(root: string, opts?: Options) {
  opts = Object.assign({}, defaultOptions, opts || {});
  const path = join(Deno.cwd(), root);
  return async function (request: Req, response: Res, next: Function) {
    // 静态资源
    const prefixUrl = parsePrefixUrl(request.url);
    if (prefixUrl) {
      const {extName} = prefixUrl;
      const responseType = lookup(extName);
      try {
        if(responseType){
          const filePath = join(path, extName);
          const contentType = `${responseType}; charset=${charset(responseType)}`;
          response.body = decoder.decode(await Deno.readFile(filePath));
          response.status = Status.OK;
          response.headers.set('content-type', contentType);
          send(request, response);
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
