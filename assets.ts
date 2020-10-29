import { contentType, extname, join, lookup, Status } from "./deps.ts";
import { parseExtname } from "./utils/parse/url.ts";
import { decoder } from "./request.ts";
import {AssetsOptions, AssetsArgument, MiddlewareFunc} from "./model.ts";
import { getErrorMessage } from "./utils/message/error.ts";

export function assets(
  options: AssetsArgument = "",
): MiddlewareFunc {
  let opts: AssetsOptions;
  if (typeof options === "string") {
    opts = {
      path: options,
      onerror(e) {
        console.log(e);
      },
    };
  } else {
    opts = {
      ...options,
      path: options.path
    };
  }
  const path = join(Deno.cwd(), opts.path as string);
  return async function (request, response, next) {
    // 静态资源
    const { extName, url } = parseExtname(request.url);
    if (extName) {
      const responseType = lookup(extName);
      try {
        if (responseType) {
          const filePath = join(path, url);
          const type = contentType(extname(filePath)) ||
            "text/plain; charset=utf-8";
          response.body = decoder.decode(await Deno.readFile(filePath));
          response.status = Status.OK;
          response.headers.set("content-type", type);
          response.send(request, response);
        } else {
          await next();
        }
      } catch (e) {
        console.log(getErrorMessage(request, "assets middleware", e));
        if (opts.onerror) {
          opts.onerror(e);
        } else {
          response.status = Status.InternalServerError;
          response.body = null;
        }
      }
    } else {
      await next();
    }
  };
}
