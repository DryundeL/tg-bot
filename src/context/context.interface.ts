import { Context } from "telegraf";

enum AddReviewStep {
  TYPE = "TYPE",
  TITLE = "TITLE",
  GENRE = "GENRE",
  RATING = "RATING",
}

export interface User {
  id: number | undefined;
  username: string | undefined;
}

export interface Review {
  id: number | undefined;
  type: string;
  title: string;
  genre: string;
  rating: number;
}

export interface SessionData {
  user: User;
  review?: Review;
  reviewStep?: AddReviewStep;
}

export interface IBotContext extends Context {
  session: SessionData;
}
