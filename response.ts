import {
  Req,
  Res
} from "./http.ts";
import {
  encode,
  join,
  Status,
  lookup,
  contentType,
} from "./deps.ts";
import {
  decoder
} from "./bodyParser.ts";

export class Response {
  response: Res

  static createResponse() {
    return {
      response: {
        headers: new Headers()
      },
      body: null,
      headers: new Headers(),
      status: Status.NotFound,
      done: false,
      redirect: redirect,
      render: render,
      send
    };
  }

  constructor() {
    this.response = Response.createResponse();
  }

  getResponse() {
    return this.response;
  }

}

async function render(response: Res, path: string) {
  try {
    response.body = decoder.decode(await Deno.readFile(join(Deno.cwd(), path)));
    response.headers.set('Content-Type', 'text/html; charset=utf-8');
    response.status = 200;
  } catch (e) {
    console.log(e);
    response.status = 500;
    response.body = 'read file wrong';
  }
}

async function redirect(response: Res, url: string) {
  response.status = 302;
  response.headers.set('Location', url);
}

export function send(req: Req, res: Res) {
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

function parseResponseBody(res: Res) {
  const {response, body, headers = new Headers()} = res;
  if (typeof body === 'object') {
    response.body = encode(JSON.stringify(body));
    headers.get('Content-Type') || headers.set('Content-Type', 'application/json; charset=utf-8');
  } else {
    response.body = encode(body.toString());
    headers.get('Content-Type') || headers.set('Content-Type', 'text/plain; charset=utf-8');
  }
}
