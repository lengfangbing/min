import {
  Req,
  Res
} from "./model.ts";
import {
  join,
  Status,
  STATUS_TEXT,
} from "./deps.ts";
import {
  decoder
} from "./request.ts";
import {
  parseResponseBody
} from "./utils/http/body/parse.ts";

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
      send
    };
  }

  static async render(res: Res, path: string){
    try {
      res.body = decoder.decode(await Deno.readFile(join(Deno.cwd(), path)));
      res.headers.set('Content-Type', 'text/html; charset=utf-8');
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
  const {response, body, headers = new Headers(), status = Status.OK} = res;
  try {
    if (body) {
      parseResponseBody(res);
    } else {
      response.body = undefined;
    }
    res.done = true;
    request.respond({...response, headers, status});
  } catch (e) {
    console.log(e);
  }
}

