import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Review, IBotContext } from "../context/context.interface";
import pool from "../db/db.config";

export class UsersReview extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("users_review", async (ctx) => {
      const username = ctx.from?.username;
      const title = ctx.session.review?.title;
      if (username) {
        const reviews = await this.showUsersReviews(username, title);

        if (reviews.length > 0) {
          const text = `
            ⭐️ Вот обзоры других пользователей на ${ctx.session.review?.type} "${ctx.session.review?.title}":

            \n${reviews
              .map((review, index) => `${index + 1}. *${review.username}* — Оценка: *${review.rating}/10*`)
              .join("\n\n")}
          `;

          const inlineKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback("⬅️ К списку обзоров", "reviews_list")],
          ]);

          await ctx.editMessageText(text, {
            parse_mode: 'Markdown',
            reply_markup: inlineKeyboard.reply_markup, // Добавляем вызов .reply_markup
          });
        } else {
          await ctx.editMessageText(
            "Никто не добавил обзор на этот фильм",
            Markup.inlineKeyboard([
              [Markup.button.callback("⬅️ Назад", `review_${ctx.session.review?.id}`)],
            ]),
          );
        }
      } else {
        await ctx.reply("Пользователь не найден.");
      }
    });

    this.bot.action("back_to_menu", async (ctx) => {
      await ctx.editMessageText(
        "Выберите действие:",
        Markup.inlineKeyboard([
          [Markup.button.callback("🗂️ Список обзоров", "reviews_list")],
          [Markup.button.callback("➕ Добавить обзор", "add_review")],
        ]),
      );
    });
  }

  private async showUsersReviews(
    username: string,
    title: string | undefined,
  ): Promise<Review[]> {
    const query = `
      SELECT DISTINCT ON (username) *
      FROM reviews
      WHERE username != $1
      AND LOWER(title) = LOWER($2)
      ORDER BY username, updated_at DESC;
    `;

    try {
      const client = await pool.connect();
      const result = await client.query(query, [username, title]);
      client.release();
      return result.rows;
    } catch (err) {
      console.error(err);
      return [];
    }
  }
}
