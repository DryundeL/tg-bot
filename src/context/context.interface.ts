import { Context } from "telegraf";

export interface User {
  id: number|undefined;
  username: string|undefined;
}

export interface Film {
  id: number;
  name: string;
  rating: number;
}

export interface SessionData {
  user: User;
}

export interface IBotContext extends Context {
  session: SessionData;
}
