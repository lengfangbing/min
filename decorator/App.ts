import { getAppInitial, getServer } from "./entity.ts";

export class App {
  async startServer() {
    await getAppInitial().listen(getServer());
  }
}
