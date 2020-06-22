import {
  Req,
  Res
} from "../deps.ts";

export default (req: Req, res: Res) => {
  res.body = {
    name: 'test-string-import-router',
    isSuccess: true
  }
}
