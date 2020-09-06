import {
  Res
} from "../../model.ts";
import {
  encode, FormFile, MultipartReader, ServerRequest
} from "../../deps.ts";
import {decoder} from "../../request.ts";

export function parseResponseBody(res: Res) {
  const {response, body, headers = new Headers()} = res;
  if (typeof body === 'object') {
    response.body = encode(JSON.stringify(body));
    headers.get('Content-Type') || headers.set('Content-Type', 'application/json; charset=utf-8');
  } else {
    response.body = encode(body.toString());
    headers.get('Content-Type') || headers.set('Content-Type', 'text/plain; charset=utf-8');
  }
}
export async function parseFormData(contentType: string, request: ServerRequest) {
  const boundaryReg = /boundary=(.+)/i;
  const match = contentType.match(boundaryReg);
  const boundary = match?.[1];
  const res: {[key: string]: string | FormFile} = {};
  if(boundary) {
    const mr = new MultipartReader(request.r, boundary);
    // 20MB
    const form = await mr.readForm(20 * 1024 * 1024);
    // const form: any = await multiParser(request);
    if (form) {
      for (const [key, value] of form.entries()) {
        const newValue: any = value || {};
        const val = <FormFile>value;
        if (val.content) {
          newValue.value = decoder.decode(val.content);
        }
        res[key] = <string | FormFile>value;
      }
    }
  }
  return res;
}
