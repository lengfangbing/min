import {
  Req,
  Res
} from '../deps.ts';
export const routerMiddleware = () => {
  return async (req: Req, res: Res, next: Function) => {
    const time1 = performance.now();
    await next();
    const time2 = performance.now();
    res.headers.set('router-response-time', (time2 - time1).toString());
  }
}
export const testDynamicRoute = (req: Req, res: Res) => {
  console.log(req.params);
  console.log(req.query);
  res.body = {
    name: 'test-data-dynamic',
    isDynamic: true,
    params: req.params
  }
};

export const postData = (req: Req, res: Res) => {
  res.body = {
    data: req.body,
    name: 'post-data',
    isPost: true
  }
}

export const redirect = (req: Req, res: Res) => {
  res.redirect('/');
}

export const render = async (req: Req, res: Res) => {
  await res.render('template/index.html');
}

