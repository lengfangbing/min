import {
  is
} from "../../../deps.ts";

import {
  assertEquals
} from "https://deno.land/std/testing/asserts.ts";

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

assertEquals(false, getRequestType('application/json').isText);
assertEquals(true, getRequestType('application/json').isJson);
