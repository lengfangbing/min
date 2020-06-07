export function isExtPath(path: string){
  const reg = /(.+)\.([\d\w]+)$/
  return reg.test(path);
}
