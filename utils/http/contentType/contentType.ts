import {
  is
} from "../../../deps.ts";

export function getRequestType(contentType: string){
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
