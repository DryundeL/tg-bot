import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { IBotContext } from "../context/context.interface";
import pool from "../db/db.config";

export class StartCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.start((ctx) => {
      if (!ctx.session.user) {
        ctx.session.user = {
          id: undefined,
          username: undefined,
        };
      }

      ctx.session.user.id = ctx.from?.id;
      ctx.session.user.username = ctx.from?.username;
      this.addUser(ctx.from?.username);
      ctx.reply(
        "Добро пожаловать! Нажмите на кнопку ниже, чтобы открыть меню:",
        Markup.keyboard([["📋 Открыть меню"]])
          .resize()
          .oneTime(false),
      );
    });

    this.bot.hears("📋 Открыть меню", (ctx) => {
      ctx.reply(
        "Выберите действие",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "Список обзоров",
              "reviews_list",
            ),
          ],
          [Markup.button.callback("Добавить обзор", "add_review")],
        ]),
      );
    });
  }

  private async addUser(username: string | undefined) {
    if (!username) {
      throw new Error("Username не может быть пустым");
    }

    const checkUserQuery = `
      SELECT * FROM users WHERE username = $1;
    `;

    const insertUserQuery = `
      INSERT INTO users (username)
      VALUES ($1)
      RETURNING *;
    `;

    try {
      const client = await pool.connect();

      const checkResult = await client.query(checkUserQuery, [username]);
      
      if (checkResult.rows.length > 0) {
        console.log("Пользователь уже существует:", checkResult.rows[0]);
        client.release();
        return checkResult.rows[0];
      }

      const insertResult = await client.query(insertUserQuery, [username]);
      client.release();

      console.log("Пользователь добавлен:", insertResult.rows[0]);
      return insertResult.rows[0];
    } catch (error) {
      console.error("Ошибка при добавлении пользователя:", error);
      throw error;
    }
  }
}
