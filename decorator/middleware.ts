export class Middleware{
  static middle: Function[] = [];

  push(func: Function){
    Middleware.middle.push(func);
  }

  getMiddle(){
    return Middleware.middle;
  }

}
