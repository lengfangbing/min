const ADDR_REG = /^((https?):\/\/)?([\d.]+):(\d+)$/;
import {
  ListenOptions
} from "../../model.ts";
export function parseAddress(addr: string): ListenOptions{
  const exec = ADDR_REG.exec(addr);
  if(!exec){
    throw TypeError('server address(addr) is invalid');
  }
  return {
    secure: exec[2] === 'https',
    hostname: exec[3],
    port: Number(exec[4])
  } as ListenOptions;
}
