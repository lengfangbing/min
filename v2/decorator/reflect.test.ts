import { assertEquals } from '../deps.ts';
import { Min } from '../type.ts';

export type ReflectRuleHandlerLike = (
  ctx: Min.Application.Ctx,
  properties?: Array<string>, // 按顺序从ctx一层层取值的属性key
) => unknown;

// @TODO 优化：每一个规则映射的都是一个方法，方法接受ctx参数，然后返回每一个规则应该返回的值
// @TODO 优化：目前只能得到一级的值，需要更好的实现方式得到二级（和多级）的值
// @TODO 方法1：目前想到的好方法是使用数组（或者链表来实现动态从ctx取值的操作）
/**
 * 通用的从ctx中利用反射获取值
 * @param {Min.Application.Ctx} ctx
 * @param {Array<Array<string>>} [properties]
 * @default 当内部出现错误就会返回void 0
 * @example
 * getValueWithCtx(ctx, [['request', 'query']]), 这个就是获取query的方法
 * getValueWithCtx(ctx, [['request', 'query', 'id'], ['request', 'body']]), 这个就是获取query中的id的方法
 */
export function getValueWithCtx(ctx: Parameters<ReflectRuleHandlerLike>[0], properties: Parameters<ReflectRuleHandlerLike>[1]) {
  try {
    // 示例
    let value = ctx;
    if (properties) {
      properties.forEach(property => {
        value = Reflect.get(value, property);
      });
    }
    return value;
  } catch (e) {
    return void 0;
  }
}

Deno.test({
  name: 'get exec value by ctx',
  fn() {
    const obj = {
      request: {
        query: {},
        body: {
          type: 'json',
          value: {
            name: 'lfb',
            age: 24,
          },
        },
      },
    } as Min.Application.Ctx;
    assertEquals(getValueWithCtx(obj, ['request', 'query']), {});
    assertEquals(getValueWithCtx(obj, ['request', 'body', 'value']), { name: 'lfb', age: 24 });
  },
});

//
// // 每一个规则都有特定的处理方法，方法只能通过ctx来处理返回真正的值
//
// /**
//  *
//  * 反射的规则
//  */
// export const REFLECT_RULES = {
// } as Record<string, ReflectRuleHandlerLike>;
//
// /**
//  * 添加一组规则的方法
//  * @param {string} key - 规则的key唯一标识，只用来去重
//  * @param {ReflectRuleHandlerLike} handler - 该规则的key的解析方法
//  */
// export function addOneRule(key: string, handler: ReflectRuleHandlerLike) {
//   REFLECT_RULES[key] = handler;
// }

// 内部的自带的规则
// addOneRule('query', getQueryValueWithCtx);