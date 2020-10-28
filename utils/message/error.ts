import {Req, ErrorMessage} from "../../model.ts";

export function getErrorMessage(req: Req, position: string, error: Error | string): ErrorMessage {
  return {
    path: req.url,
    req,
    error: error.toString(),
    position,
  }
}
