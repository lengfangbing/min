
const middle: Function[] = [];
export class Middleware{

  push(func: Function){
    middle.push(func);
  }

  getMiddle(){
    return middle;
  }

}
