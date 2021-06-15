import { Min } from "../type.ts";
import { assertEquals, join, Response, Status, STATUS_TEXT } from '../deps.ts';

export const DEFAULT_STATUS = Status.NotFound;

/**
 * 获取merge后的status
 * @param {Status} status 当前的status
 * @param {Status} [resetValue ] 当前的status若不存在或是默认值，赋值的新的status
 */
function getStatusIfExist (status: Status, resetValue?: Status) {
  if (status === void 0 || status === DEFAULT_STATUS) {
    return resetValue || DEFAULT_STATUS;
  }

  return status;
}

function createCtx<T>(otherConfig?: Partial<Min.Application.Ctx<T>>) {
    return {
      response: {
        headers: new Headers(),
      },
      ...otherConfig,
    } as Min.Application.Ctx<T>;
  }

/**
 * 对ctx.response.body进行解析
 * @param {Min.Application.Ctx} ctx 
 */
 export function respondBody(ctx: Min.Application.Ctx<unknown>) {
    const { body: originValue, headers } = ctx.response;
    let { status } = ctx.response;
    // 可以设置originResponse的值，最终都会调用ctx.originRequest.respond()进行返回
    let body: Response['body'];
    const statusOk = getStatusIfExist(status, Status.OK);
  
    h: {
      if ('HEAD' === ctx.request.method.toUpperCase()) {
        // 判断是不是HEAD请求，如果是，就取消设置body返回值
        // quote https://datatracker.ietf.org/doc/html/rfc7231#section-4.3.2
        body = void 0;
        // 设置status
        status = statusOk;
        break h;
      }
      
      // 是否是Uint8Array或者Deno.Reader或者string
      if (
        typeof originValue === 'string'
        || originValue instanceof Uint8Array
        || originValue instanceof Deno.File
      ) {
        body = originValue;
        // 设置status
        status = statusOk;
        break h;
      }

      // 如果不存在body
      if (originValue === null || originValue === void 0) {
        body = void 0;
        // status取值如果用户指定过，那就是用户指定的status，如果用户没指定过，那就是默认NotFound
        break h;
      }
  
      // 是json数据
      body = JSON.stringify(originValue);
      // 设置status
      status = statusOk;
      break h;
    }
  
    // 构造响应对象
    const response: Response = {
      status,
      body,
      headers: headers,
      statusText: STATUS_TEXT.get(status),
      // 以原生的response为主，所以这个在使用中不要轻易设置，除非自己清楚自己在干什么！
      ...ctx.originResponse,
    };
  
    // 响应请求
    ctx.originRequest.respond(response);
  }
  
  Deno.test({
    name: 'response body',
    async fn() {
      let val: Record<string, unknown> = {};
      const _ownRespond = (res: unknown) => {
        val = res as unknown as typeof val;
      }
      const ctx1 = createCtx<unknown>({
        originRequest: {
          respond: _ownRespond,
        } as unknown as Min.Application.Ctx['originRequest'],
        request: {
          method: 'HEAD',
        } as Min.Application.Ctx['request'],
        response: {
          body: '123123',
        } as Min.Application.Ctx['response'],
      });
      const ctx2 = createCtx<unknown>({
        originRequest: {
          respond: _ownRespond,
        } as unknown as Min.Application.Ctx['originRequest'],
        request: {
          method: 'GET',
        } as Min.Application.Ctx['request'],
        response: {
          body: '123123',
        } as Min.Application.Ctx['response'],
      });
      const file = await Deno.open(join(Deno.cwd(), "../test_files/multipart.txt"));
      const fileArray = await Deno.readFile(join(Deno.cwd(), "../test_files/multipart.txt"));
      const ctx3 = createCtx<Record<string, unknown>>({
        originRequest: {
          respond: _ownRespond,
        } as unknown as Min.Application.Ctx['originRequest'],
        request: {
          method: 'POST',
        } as Min.Application.Ctx['request'],
        response: {
          body: file,
        } as unknown as Min.Application.Ctx<Record<string, unknown>>['response'],
      });
      const ctx4 = createCtx<Uint8Array>({
        originRequest: {
          respond: _ownRespond,
        } as unknown as Min.Application.Ctx['originRequest'],
        request: {
          method: 'PUT',
        } as Min.Application.Ctx['request'],
        response: {
          body: fileArray,
        } as Min.Application.Ctx<Uint8Array>['response'],
      });
      const ctx5 = createCtx<number>({
        originRequest: {
          respond: _ownRespond,
        } as unknown as Min.Application.Ctx['originRequest'],
        request: {
          method: 'DELETE',
        } as Min.Application.Ctx['request'],
        response: {
          body: 123,
        } as Min.Application.Ctx<number>['response'],
      });
  
      // 测试body值
      respondBody(ctx1);
      assertEquals(val.body, void 0);
      assertEquals(val.status, Status.OK);
      respondBody(ctx2);
      assertEquals(val.body, '123123');
      assertEquals(val.status, Status.OK);
      respondBody(ctx3);
      assertEquals(val.body, file);
      assertEquals(val.status, Status.OK);
      respondBody(ctx4);
      assertEquals(val.body, fileArray);
      assertEquals(val.status, Status.OK);
      respondBody(ctx5);
      assertEquals(val.body, '123');
      assertEquals(val.status, Status.OK);
  
      Deno.close(file.rid);
    }
  })