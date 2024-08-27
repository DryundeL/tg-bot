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
      // Инициализируем объект ctx.session.user, если он не существует
      if (!ctx.session.user) {
        ctx.session.user = {
          id: undefined,
          username: undefined, // Инициализируем пустой строкой или другим значением по умолчанию
        };
      }

      ctx.session.user.id = ctx.from?.id;
      ctx.session.user.username = ctx.from?.username;
      this.addUser(ctx.from?.username);
      ctx.reply(
        "Добро пожаловать! Нажмите на кнопку ниже, чтобы открыть меню:",
        Markup.keyboard([["📋 Открыть меню"]])
          .resize()
          .oneTime(false), // Клавиатура будет отображаться постоянно
      );
    });

    // Обработка нажатия на кнопку "Открыть меню"
    this.bot.hears("📋 Открыть меню", (ctx) => {
      ctx.reply(
        "Выберите действие",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "Список просмотренных фильмов/сериалов",
              "films_list",
            ),
          ],
          [Markup.button.callback("Добавить фильм", "add_film")],
          [Markup.button.callback("Редактировать фильм", "edit_film")],
          [Markup.button.callback("Удалить фильм", "delete_film")],
        ]),
      );
    });
  }

  private async addUser(username: string | undefined) {
    if (!username) {
      throw new Error("Username не может быть пустым");
    }

    const query = `
    INSERT INTO users (username)
    VALUES ($1);
  `;

    try {
      const client = await pool.connect();
      const result = await client.query(query, [username]);
      client.release();

      console.log("Пользователь добавлен или обновлен:", result.rows[0]);
      return result.rows[0]; // Возвращаем добавленного или обновленного пользователя
    } catch (error) {
      console.error("Ошибка при добавлении пользователя:", error);
      throw error;
    }
  }
}
