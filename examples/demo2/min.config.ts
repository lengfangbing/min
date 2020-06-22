import {
  MinConfig
} from './deps.ts';

import {
  testDynamicRoute,
  postData,
  redirect,
  render,
  routerMiddleware
} from './routes/index.ts';
export default {
  server: {
    port: 7000,
    hostname: "127.0.0.1",
    // certFile: '',
    // keyFile: '',
    // secure: false,
    addr: "http://127.0.0.1:8000"//(high level)
  },
  routes: [
    {
      url: '/',
      method: "GET",
      func: render
    },
    {
      url: "/name/:id/:name/v1/detail",
      method: "GET",
      func: testDynamicRoute,
      middleware: [routerMiddleware()]
    },
    {
      url: '/postData',
      method: 'post',
      func: postData
    },
    {
      url: '/test',
      method: 'get',
      func: '/routes/test.ts'
    },
    {
      url: '/redirect',
      method: 'GET',
      func: redirect
    },
    {
      url: '/',
      method: 'Get',
      func: render
    }
  ],
  cors: {
    origin: '*',
    allowMethods: ["get", "post", "options", "put", "delete"],
    allowHeaders: ["content-type"],
    maxAge: 0,
    allowCredentials: false
  },
  // set assets request render files directory, default is working directory
  assets: "assets"
} as MinConfig;
