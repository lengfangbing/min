import { assertEquals } from '../deps.ts';
import { Min } from '../type.ts';

export type ReflectRuleHandlerLike = (
  ctx: Min.Application.Ctx,
  properties?: Array<string>, // 按顺序从ctx一层层取值的属性key
) => unknown;

/**
 * 通用的从反射的对象中利用反射获取值
 * @param {Record<string, unknown>} reflectValue
 * @param {Array<Array<string>>} [properties]
 * @default 当内部出现错误就会返回void 0
 * @example
 * getValueWithCtx(reflectValue, ['request', 'query']), 这个就是获取query的方法
 * getValueWithCtx(reflectValue, ['request', 'query', 'id']), 这个就是获取query中的id的方法
 */
export function getValueByReflect(reflectValue: Record<string, unknown>, properties: Array<string>) {
  try {
    // 示例
    let value = reflectValue;
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
    const ctx = {
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
    assertEquals(getValueByReflect(ctx, ['request', 'query']), {});
    assertEquals(getValueByReflect(ctx, ['request', 'body', 'value']), { name: 'lfb', age: 24 });
  },
});
