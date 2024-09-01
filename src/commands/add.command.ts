import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Review, IBotContext } from "../context/context.interface";
import pool from "../db/db.config";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";

enum AddReviewStep {
  TYPE = "TYPE",
  TITLE = "TITLE",
  GENRE = "GENRE",
  RATING = "RATING",
}

export class AddCommand extends Command {
  private genres: string[] = [
    "Боевик",
    "Комедия",
    "Драма",
    "Фантастика",
    "Фэнтези",
    "Ужасы",
    "Романтика",
    "Научный",
    "Триллер",
    "Попаданцы"
  ];

  private types: string[] = [
    "Фильм",
    "Сериал",
    "Аниме",
    "Дорама",
    "Манга",
    "Манхва",
    "Маньхуа"
  ];

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("add_review", async (ctx) => {
      ctx.session.review = {
              id: undefined,
              type: ctx.session.review?.type ?? "",
              title: "",
              genre: "",
              rating: 0,
            };
      ctx.session.reviewStep = AddReviewStep.TYPE;
      
       await ctx.reply(
        "Выберите тип предмета обзора:",
        Markup.inlineKeyboard(
          this.types.map((type, index) =>
            [Markup.button.callback(type, `type_${index}`)]
          )
        )
      );
    });

    this.bot.on("text", async (ctx) => {
      const username = ctx.from?.username;

      if (ctx.session.reviewStep) {
        switch (ctx.session.reviewStep) {

          
          case AddReviewStep.TITLE: {
            ctx.session.review = {
              id: undefined,
              type: ctx.session.review?.type ?? "",
              title: ctx.message.text,
              genre: "",
              rating: 0,
            };
            ctx.session.reviewStep = AddReviewStep.GENRE;
            await ctx.reply(
              "Выберите жанр фильма:",
              Markup.inlineKeyboard(
                this.genres.map((genre, index) =>
                  [Markup.button.callback(genre, `genre_${index}`)]
                )
              )
            );
            break;
          }

          case AddReviewStep.RATING: {
            const rating = parseInt(ctx.message.text);
            if (
              ctx.session.review &&
              !isNaN(rating) &&
              rating >= 1 &&
              rating <= 10
            ) {
              ctx.session.review.rating = rating;
              await this.saveFilm(ctx.session.review, username);
              await ctx.reply(
                `Обзор на "${ctx.session.review.title}" добавлен с рейтингом ${ctx.session.review.rating}/10 в жанре "${ctx.session.review.genre}".`
              );
              this.resetSession(ctx);
            } else {
              await ctx.reply(
                "Пожалуйста, введите корректное число от 1 до 10."
              );
            }
            break;
          }

          default:
            break;
        }
      }
    });

    this.bot.action(/^type_\d+$/, async (ctx) => {
      const callbackQuery = ctx.callbackQuery as CallbackQuery;

      if ("data" in callbackQuery) {
        const typeIndex = parseInt(callbackQuery.data.split('_')[1]);

        if (ctx.session.review) {
          ctx.session.review.type = this.types[typeIndex];
          ctx.session.reviewStep = AddReviewStep.TITLE;
          await ctx.reply(`Введите название ${ctx.session.review.type}:`);
        }
      }
    });

    this.bot.action(/^genre_\d+$/, async (ctx) => {
      const callbackQuery = ctx.callbackQuery as CallbackQuery;

      if ("data" in callbackQuery) {
        const genreIndex = parseInt(callbackQuery.data.split('_')[1]);

        if (ctx.session.review) {
          ctx.session.review.genre = this.genres[genreIndex];
          ctx.session.reviewStep = AddReviewStep.RATING;
          await ctx.reply("Оцените фильм по шкале от 1 до 10:");
        }
      }
    });
  }

  private async saveFilm(review: Review, username: string | undefined) {
    const createUsersTableQuery = `
      INSERT INTO reviews (type, title, genre, rating, username)
      VALUES ($1, $2, $3, $4, $5);
    `;

    try {
      const client = await pool.connect();
      await client.query(createUsersTableQuery, [
        review.type,
        review.title,
        review.genre,
        review.rating,
        username,
      ]);
      client.release();
    } catch (err) {
      console.error(err);
    }
  }

  private resetSession(ctx: IBotContext) {
    delete ctx.session.reviewStep;
    delete ctx.session.review;
  }
}
