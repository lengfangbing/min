import {
  Req,
  ReqMethod
} from "./http.ts";
import {
  FormFile,
  is,
  MultipartReader,
  urlDecode,
  ServerRequest
} from "./deps.ts";
import {
  parseUrlQuery
} from "./utils/url/url.ts";
import {
  ReqObjectField
} from "./http.ts";

export const decoder = new TextDecoder();

export class Request{
  static createRequest(config: any) {
    return {
      query: null,
      params: null,
      body: null,
      request: new ServerRequest(),
      url: '',
      method: 'get' as ReqMethod,
      headers: new Headers(),
      ...config
    };
  }

  parseUrlAndQuery(request: Req){
    const { url, query } = parseUrlQuery(request.url);
    Object.assign(request, {
      query: query as ReqObjectField,
      url,
    });
  }

  #hasBody = (headers: Headers): boolean => {
    return (
      headers.get("transfer-encoding") !== null ||
      !!parseInt(headers.get("content-length") ?? "")
    );
  }

  async parseBody(request: Req){
    const req: ServerRequest = request.request;
    const contentType = request.headers.get('content-type') || 'text';
    let body = {type: '', value: {}} as ReqObjectField;
    if(this.#hasBody(request.headers)){
      // field to save body
      let _body: ReqObjectField = {};
      // field to save type
      let type: string = '';
      const contentTypeFilter = getContentType(contentType);
      // deal with form-data first
      if(contentTypeFilter.isFormData){
        _body = await parseFormData(contentType, req) as ReqObjectField;
        type = 'formData';
      }else{
        // get net request body text
        const readContent = await Deno.readAll(req.body);
        // get http body text
        const _b = decoder.decode(readContent);
        if(contentTypeFilter.isText){
          _body = _b;
          type = 'text';
        }else if(contentTypeFilter.isJson){
          _body = JSON.parse(_b);
          type = 'json';
        }else if(contentTypeFilter.isUrlencoded){
          _body = parseUrlencoded(_b);
          type = 'form'
        }else{
          _body = {
            content: readContent,
            value: _b
          };
          type = 'raw';
        }
      }
      Object.assign(body, {value: _body}, {type});
    }else{
      body = null;
    }
    request.body = body;
  }
}
async function parseFormData(contentType: string, request: ServerRequest) {
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
function parseUrlencoded(str: string) {
  return (
    str.length
      ? urlDecode(str)
      : null
  );
}
function getContentType(contentType: string){
  const typeRes = {
    isText: false,
    isUrlencoded: false,
    isJson: false,
    isFormData: false
  }
  s: {
    if(is(contentType, ['json'])){
      typeRes.isJson = true;
      break s;
    }
    if(is(contentType, ['urlencoded'])){
      typeRes.isUrlencoded = true;
      break s;
    }
    if(is(contentType, ['multipart'])){
      typeRes.isFormData = true;
      break s;
    }
    if(is(contentType, ['text'])){
      typeRes.isText = true;
      break s;
    }
  }
  return typeRes;
}
