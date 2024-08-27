import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Film, IBotContext } from "../context/context.interface";
import pool from "../db/db.config";

enum AddFilmStep {
  TITLE = "TITLE",
  GENRE = "GENRE",
  RATING = "RATING",
}

export class AddCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("add_film", async (ctx) => {
      ctx.session.filmStep = AddFilmStep.TITLE;
      await ctx.reply("Введите название фильма, который хотите добавить:");
    });

    this.bot.on("text", async (ctx) => {
      const username = ctx.from?.username;

      if (ctx.session.filmStep) {
        switch (ctx.session.filmStep) {
          case AddFilmStep.TITLE: {
            ctx.session.film = {
              title: ctx.message.text,
              genre: "",
              rating: 0,
            };
            ctx.session.filmStep = AddFilmStep.GENRE;
            await ctx.reply("Введите жанр фильма:");
            break;
          }

          case AddFilmStep.GENRE: {
            if (ctx.session.film) {
              ctx.session.film.genre = ctx.message.text;
              ctx.session.filmStep = AddFilmStep.RATING;
              await ctx.reply("Оцените фильм по шкале от 1 до 10:");
            }
            break;
          }

          case AddFilmStep.RATING: {
            const rating = parseInt(ctx.message.text);
            if (
              ctx.session.film &&
              !isNaN(rating) &&
              rating >= 1 &&
              rating <= 10
            ) {
              ctx.session.film.rating = rating;
              await this.saveFilm(ctx.session.film, username);
              await ctx.reply(
                `Фильм "${ctx.session.film.title}" добавлен с рейтингом ${ctx.session.film.rating}/10 в жанре "${ctx.session.film.genre}".`,
              );
              this.resetSession(ctx);
            } else {
              await ctx.reply(
                "Пожалуйста, введите корректное число от 1 до 10.",
              );
            }
            break;
          }

          default:
            break;
        }
      }
    });
  }

  private async saveFilm(film: Film, username: string | undefined) {
    console.log("Сохранение фильма:", film);
    const createUsersTableQuery = `
      INSERT INTO film_reviews (title, genre, rating, username)
      VALUES ($1, $2, $3, $4);
    `;

    try {
      const client = await pool.connect();
      await client.query(createUsersTableQuery, [
        film.title,
        film.genre,
        film.rating,
        username,
      ]);
      client.release();
    } catch (err) {
      console.error(err);
    }
  }

  private resetSession(ctx: IBotContext) {
    delete ctx.session.filmStep;
    delete ctx.session.film;
  }
}
