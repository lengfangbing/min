import { send } from "./response.ts";
import { CorsOptions, MiddlewareFunc } from "./model.ts";

const defaultMethods = ["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH"];
export function cors(options: CorsOptions = {}): MiddlewareFunc {
  let realOrigin = "";
  const {
    origin = "*",
    allowCredentials = true,
    allowMethods = defaultMethods,
    exposeHeaders,
    maxAge,
    allowHeaders,
  } = options;
  return async function (request, response, next) {
    const method = request.method.toUpperCase();
    const Origin = request.headers.get("Origin");
    // set vary
    response.headers.set("Vary", request.headers.get("Origin") || "");
    // get real origin
    realOrigin = typeof origin === "function"
      ? await origin(request) || "*"
      : origin;

    if (!Origin || !realOrigin) return await next();
    // set all common response header
    response.headers.set("Access-Control-Allow-Origin", realOrigin);
    // set expose headers
    exposeHeaders
      ? response.headers.set(
        "Access-Control-Expose-Headers",
        exposeHeaders.join(","),
      )
      : "";
    // allow cookies
    if (allowCredentials) {
      // if origin is '*', should not contains cookies
      realOrigin === "*"
        ? response.headers.delete("Access-Control-Allow-Credentials")
        : response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    // check method
    if (method === "OPTIONS") {
      // prefix request,
      // this attr means the real request method,
      // may not be options
      if (!request.headers.get("Access-Control-Request-Method")) {
        return await next();
      }
      // allow request methods
      response.headers.set(
        "Access-Control-Allow-Methods",
        allowMethods ? allowMethods.join(",") : defaultMethods.join(","),
      );
      // allow request headers
      response.headers.set(
        "Access-Control-Allow-Headers",
        allowHeaders
          ? allowHeaders.join(",")
          : request.headers.get("Access-Control-Request-Headers") || "",
      );
      // set max age
      maxAge &&
        response.headers.set("Access-Control-Max-Age", String(maxAge));

      response.status = 204;

      return send(request, response);
    } else {
      // set expose headers
      exposeHeaders
        ? response.headers.set(
          "Access-Control-Expose-Headers",
          exposeHeaders.join(","),
        )
        : "";
      try {
        await next();
      } catch (e) {
        console.log(e);
      }
    }
  };
}
