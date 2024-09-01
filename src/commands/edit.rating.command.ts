import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Review, IBotContext } from '../context/context.interface';
import pool from "../db/db.config";

export class EditRatingCommand extends Command {

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("edit_review_rating", async (ctx) => {
      console.log("Action 'edit_review_rating' triggered");

      if (!ctx.session.review) {
        console.error("Review not found in session");
        await ctx.reply("Не удалось найти обзор в сессии. Пожалуйста, попробуйте снова.");
        return;
      }

      // Устанавливаем флаг ожидания ввода рейтинга
      ctx.session.waitingForRating = true;

      console.log("Review found in session:", ctx.session.review);
      await ctx.reply("Введите новый рейтинг обзора:");
    });

    this.bot.on("text", async (ctx) => {
      console.log("Received text:", ctx.message.text);

      // Проверяем, ожидает ли бот ввода рейтинга
      if (ctx.session.waitingForRating) {
        const review = ctx.session.review;
        const rating = parseInt(ctx.message.text);

        console.log("Parsed rating:", rating);

        if (review && !isNaN(rating) && rating >= 1 && rating <= 10) {
          console.log("Updating review rating");
          await this.updateRatingReview(review, rating, ctx.from?.username);
          await ctx.reply(
            "Рейтинг обновлен",
            Markup.inlineKeyboard([
              [Markup.button.callback("Вернуться", `review_${review?.id}`)],
            ]),
          );

          // Сбрасываем флаг ожидания ввода рейтинга
          ctx.session.waitingForRating = false;
        } else {
          console.error("Invalid rating entered or review not found");
          await ctx.reply(
            "Пожалуйста, введите корректное число от 1 до 10.",
          );
        }
      }
    });
  }

  private async updateRatingReview(review: Review, rating: number, username: string | undefined) {
    const updateQuery = `
      UPDATE reviews SET rating = $1 WHERE username = $2 AND id = $3;
    `;

    try {
      const client = await pool.connect();
      const result = await client.query(updateQuery, [
        rating,
        username,
        review.id
      ]);
      client.release();
      console.log("Review updated:", result.rowCount);
    } catch (err) {
      console.error("Ошибка при обновлении рейтинга:", err);
    }
  }
}
