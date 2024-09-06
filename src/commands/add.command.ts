import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Review, IBotContext } from "../context/context.interface";
import pool from "../db/db.config";
import {
  CallbackQuery,
  InlineKeyboardButton,
} from "telegraf/typings/core/types/typegram";

enum AddReviewStep {
  TITLE = "TITLE",
  TYPE = "TYPE",
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
    "Попаданцы",
  ];

  private types: string[] = [
    "Фильм",
    "Сериал",
    "Аниме",
    "Дорама",
    "Манга",
    "Манхва",
    "Маньхуа",
  ];

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("add_review", async (ctx) => {
      ctx.session.reviewStep = AddReviewStep.TITLE;
      await ctx.reply("Введите название фильма, который хотите добавить:");
    });

    this.bot.on("text", async (ctx) => {
      if (ctx.session.reviewStep === AddReviewStep.TITLE) {
        const existingReview = await this.findReviewByTitle(
          ctx.from?.username,
          ctx.message.text,
        );

        if (existingReview) {
          await ctx.reply(
            `Обзор с названием "${ctx.message.text}" уже существует. Хотите его открыть?`,
            Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  `Открыть обзор: "${existingReview.title}"`,
                  `review_${existingReview.id}`,
                ),
              ],
              [Markup.button.callback("⬅️ В главное меню", "back_to_menu")],
            ]),
          );
        } else {
          ctx.session.review = {
            id: undefined,
            username: ctx.from?.username,
            type: ctx.session.review?.type ?? "",
            title: ctx.message.text,
            genre: "",
            rating: 0,
          };
          ctx.session.reviewStep = AddReviewStep.TYPE;

          await ctx.reply(
            "Выберите тип предмета обзора:",
            Markup.inlineKeyboard(
              this.types.map((type, index) => [
                Markup.button.callback(type, `type_${index}`),
              ]),
            ),
          );
        }
      }
    });

    this.bot.action(/^type_\d+$/, async (ctx) => {
      const callbackQuery = ctx.callbackQuery as CallbackQuery;

      if ("data" in callbackQuery) {
        const typeIndex = parseInt(callbackQuery.data.split("_")[1]);

        if (ctx.session.review) {
          ctx.session.review.type = this.types[typeIndex];
          ctx.session.reviewStep = AddReviewStep.GENRE;
          await ctx.editMessageText(
            "Выберите жанр фильма:",
            Markup.inlineKeyboard(
              this.genres.map((genre, index) => [
                Markup.button.callback(genre, `genre_${index}`),
              ]),
            ),
          );
        }
      }
    });

    this.bot.action(/^genre_\d+$/, async (ctx) => {
      const callbackQuery = ctx.callbackQuery as CallbackQuery;

      if ("data" in callbackQuery) {
        const genreIndex = parseInt(callbackQuery.data.split("_")[1]);

        if (ctx.session.review) {
          ctx.session.review.genre = this.genres[genreIndex];
          ctx.session.reviewStep = AddReviewStep.RATING;
          await ctx.editMessageText(
            "Выберите рейтинг обзора:",
            Markup.inlineKeyboard(
              Array.from({ length: 10 }, (_, i) =>
                Markup.button.callback(`${i + 1}`, `rating_${i + 1}`),
              ).reduce<InlineKeyboardButton[][]>((acc, button, index) => {
                if (index % 4 === 0) acc.push([]);
                acc[acc.length - 1].push(button);
                return acc;
              }, []),
            ),
          );
        }
      }
    });

    this.bot.action(/^rating_\d+$/, async (ctx) => {
      const callbackQuery = ctx.callbackQuery as CallbackQuery;

      if ("data" in callbackQuery) {
        const rating = parseInt(callbackQuery.data.split("_")[1]);

        if (ctx.session.review) {
          ctx.session.review.rating = rating;
          await this.saveReview(ctx.session.review, ctx.from?.username);
          await ctx.editMessageText(
            `Обзор на ${ctx.session.review.type} "${ctx.session.review.title}" добавлен с рейтингом ${ctx.session.review.rating}/10 в жанре "${ctx.session.review.genre}".`,
            Markup.inlineKeyboard([
              Markup.button.callback("⬅️ В главное меню", "back_to_menu"),
            ]),
          );
          this.resetSession(ctx);
        }
      }
    });
  }

  private async findReviewByTitle(
    username: string | undefined,
    title: string,
  ): Promise<Review | null> {
    const query = `
      SELECT * FROM reviews
      WHERE username = $1
      AND title ILIKE $2
      LIMIT 1;
  `;

    try {
      const client = await pool.connect();
      const result = await client.query(query, [username, title]);
      client.release();
      return result.rows[0] || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  private async saveReview(review: Review, username: string | undefined) {
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
