import {
  Req,
  Res
} from "./model.ts";
import {
  join,
  Status,
  STATUS_TEXT,
  contentType,
  extname
} from "./deps.ts";
import {
  decoder
} from "./request.ts";
import {
  parseResponseBody
} from "./utils/parse/body.ts";
import {
  Cookie
} from "./cookie.ts";

export class Response {

  static createResponse() {
    return {
      response: {
        headers: new Headers()
      },
      body: null,
      headers: new Headers(),
      status: Status.NotFound,
      done: false,
      redirect: this.redirect,
      render: this.render,
      cookies: new Cookie(),
      send
    };
  }

  static async render(res: Res, path: string){
    const v = decoder.decode(await Deno.readFile(join(Deno.cwd(), path)));
    const cType = contentType(extname(path)) || 'text/plain; charset=utf-8';
    try {
      res.body = v;
      res.headers.set('Content-Type', cType);
      res.status = Status.OK;
    } catch (e) {
      console.log(e);
      res.status = Status.InternalServerError;
      res.body = STATUS_TEXT.get(Status.InternalServerError);
    }
  }

  static redirect(res: Res, url: string){
    res.status = Status.Found;
    res.headers.set('Location', url);
  }

}

export function send(req: Req, res: Res) {
  if(res.done) return;
  const request = req.request;
  const {response, body, headers = new Headers(), status = Status.OK, cookies} = res;
  try {
    if (body) {
      parseResponseBody(res);
    } else {
      response.body = undefined;
    }
    res.done = true;
    cookies.getCookies().forEach((value) => {
      headers.set('Set-Cookie', value);
    });
    request.respond({...response, headers, status});
  } catch (e) {
    console.log(e);
  }
}

