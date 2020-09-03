import { getApp } from "./entity.ts";

export class App {
  async startServer() {
    console.log(getApp());
  }
}
