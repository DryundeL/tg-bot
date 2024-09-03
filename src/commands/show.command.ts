import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";
import pool from "../db/db.config";

export class ShowCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
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
            [
              Markup.button.callback(
                "✏️ Редактировать рейтинг",
                "edit_review_rating",
              ),
            ],
            [Markup.button.callback("🗑️ Удалить обзор", "delete_review")],
            [
              Markup.button.callback(
                "🗂️👥 Обзоры пользователей",
                "users_review",
              ),
            ],
          ]),
        );
      }
    });
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
