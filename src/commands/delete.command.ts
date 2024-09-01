import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Review, IBotContext } from "../context/context.interface";
import pool from "../db/db.config";

export class DeleteCommand extends Command {

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("delete_review", async (ctx) => {
      const review = ctx.session.review;
      await ctx.editMessageText(
        "Вы уверены?",
        Markup.inlineKeyboard(
          [
            Markup.button.callback("Да", "confirm"),
            Markup.button.callback("Нет", `review_${review?.id}`),
          ]
        ),
      );
    });

    this.bot.action("confirm", async (ctx) => {
      const review = ctx.session.review;
      const username = ctx.from?.username;

      await this.deleteReview(review, username);

      await ctx.editMessageText(
        "Обзор удален",
        Markup.inlineKeyboard(
          [
            Markup.button.callback("🗂️ К списку", "reviews_list"),
          ]
        ),
      );
    });
  }

  private async deleteReview(review: Review | undefined, username: string | undefined) {
    const createUsersTableQuery = `
      DELETE FROM reviews WHERE username = $1 AND id = $2;
    `;

    try {
      const client = await pool.connect();
      await client.query(createUsersTableQuery, [
        username,
        review?.id,
      ]);
      client.release();
    } catch (err) {
      console.error(err);
    }
  }
}
