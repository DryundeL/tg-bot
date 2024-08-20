import { Context } from "telegraf";

enum AddFilmStep {
  TITLE = "TITLE",
  GENRE = "GENRE",
  RATING = "RATING",
}

export interface User {
  id: number | undefined;
  username: string | undefined;
}

export interface Film {
  title: string;
  genre: string;
  rating: number;
}

export interface SessionData {
  user: User;
  film?: Film;
  filmStep?: AddFilmStep;
}

export interface IBotContext extends Context {
  session: SessionData;
}
