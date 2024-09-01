import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Review, IBotContext } from "../context/context.interface";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";
import pool from "../db/db.config";

export class IndexCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("reviews_list", async (ctx) => {
      const username = ctx.from?.username;
      if (username) {
        const reviews = await this.showReviews(username);

        if (reviews.length > 0) {
          const buttons = reviews.map((review) =>
            Markup.button.callback(
              `${review.type} "${review.title}" ➡️`,
              `review_${review.id}`,
            ),
          );

          const inlineKeyboard = Markup.inlineKeyboard([
            [Markup.button.callback("⬅️ В главное меню", "back_to_menu")],
            ...buttons.map((button) => [button]),
          ]);

          await ctx.editMessageText("Ваши обзоры:", inlineKeyboard);
        } else {
          await ctx.editMessageText(
            "У вас пока нет добавленных обзоров.",
            Markup.inlineKeyboard([
              [Markup.button.callback("⬅️ Назад", "back_to_menu")],
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

    this.bot.action(/^review_\d+$/, async (ctx) => {
      const callbackQuery = ctx.callbackQuery as CallbackQuery;

      if ("data" in callbackQuery) {
        const reviewId = parseInt(callbackQuery.data.split("_")[1]);
        const review = await this.showReview(reviewId);
        ctx.session.review = review;

        ctx.editMessageText(
          `Обзор на ${review.type} "${review.title}" \nС рейтигом ${review.rating}/10 \nВ жанре ${review.genre}`,
          Markup.inlineKeyboard([
            [Markup.button.callback("⬅️ Назад", "reviews_list")],
            [Markup.button.callback("✏️ Редактировать рейтинг", "edit_review_rating")],
            [Markup.button.callback("🗑️ Удалить обзор", "delete_review")],
            [Markup.button.callback("🗂️👥 Обзоры пользователей", "users_review")],
          ]),
        );
      }
    });
  }

  private async showReviews(username: string): Promise<Review[]> {
    const query = `
      SELECT * FROM reviews
      WHERE username = $1
    `;

    try {
      const client = await pool.connect();
      const result = await client.query(query, [username]);
      client.release();
      return result.rows;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  private async showReview(id: number) {
    const query = `
      SELECT * FROM reviews
      WHERE id = $1
    `;

    try {
      const client = await pool.connect();
      const result = await client.query(query, [id]);
      client.release();
      return result.rows[0];
    } catch (err) {
      console.error(err);
      return [];
    }
  }
}
