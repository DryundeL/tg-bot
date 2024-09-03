import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Review, IBotContext } from "../context/context.interface";
import pool from "../db/db.config";
import { CallbackQuery, InlineKeyboardButton } from "telegraf/typings/core/types/typegram";

export class EditRatingCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("edit_review_rating", async (ctx) => {
      await ctx.editMessageText(
        "Выберите рейтинг обзора:",
        Markup.inlineKeyboard(
          Array.from({ length: 10 }, (_, i) =>
            Markup.button.callback(`${i + 1}`, `edit_rating_${i + 1}`),
          ).reduce<InlineKeyboardButton[][]>((acc, button, index) => {
            if (index % 4 === 0) acc.push([]);
            acc[acc.length - 1].push(button);
            return acc;
          }, []),
        ),
      );
    });

    this.bot.action(/^edit_rating_\d+$/, async (ctx) => {
      const callbackQuery = ctx.callbackQuery as CallbackQuery;

      if ("data" in callbackQuery) {
        const rating = parseInt(callbackQuery.data.split("_")[2]);

        if (ctx.session.review) {
          await this.updateRatingReview(ctx.session.review, rating, ctx.from?.username);
          await ctx.editMessageText(
            `Рейтинг обновлен`,
            Markup.inlineKeyboard([
              Markup.button.callback("⬅️ Назад", `review_${ctx.session.review.id}`),
            ]),
          );
        }
      }
    });
  }

  private async updateRatingReview(
    review: Review,
    rating: number,
    username: string | undefined,
  ) {
    const updateQuery = `
      UPDATE reviews SET rating = $1, updated_at = NOW() WHERE username = $2 AND id = $3;
    `;

    try {
      const client = await pool.connect();
      await client.query(updateQuery, [
        rating,
        username,
        review.id,
      ]);
      client.release();
    } catch (err) {
      console.error("Ошибка при обновлении рейтинга:", err);
    }
  }
}
