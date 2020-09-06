import {
  contentType,
  extname,
  join,
  lookup,
  Status
} from "./deps.ts";
import {
  parseExtname
} from "./utils/parse/url.ts";
import {
  decoder
} from "./request.ts";
import {
  MiddlewareFunc
} from "./model.ts";

export function assets(options: string | Record<string, any> = ''): MiddlewareFunc {
  let opts: Record<string, any>;
  if (typeof options === "string") {
    opts = {
      path: options
    };
  } else {
    opts = options;
  }
  const path = join(Deno.cwd(), opts.path);
  return async function (request, response, next) {
    // 静态资源
    const {extName, url} = parseExtname(request.url);
    if (extName) {
      const responseType = lookup(extName);
      try {
        if (responseType) {
          const filePath = join(path, url);
          const type = contentType(extname(filePath)) || 'text/plain; charset=utf-8';
          response.body = decoder.decode(await Deno.readFile(filePath));
          response.status = Status.OK;
          response.headers.set('content-type', type);
          response.send(request, response);
        } else {
          await next();
        }
      } catch (e) {
        if (opts.onerror) {
          opts.onerror(e);
        } else {
          throw Error(e);
        }
      }
    } else {
      await next();
    }
  }
}
