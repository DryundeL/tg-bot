import { Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Film, IBotContext } from "../context/context.interface";
import pool from "../db/db.config";

export class IndexCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.action("films_list", async (ctx) => {
      const username = ctx.from?.username;
      if (username) {
        const films = await this.showFilms(username);
        if (films.length > 0) {
          const filmsList = films
            .map((film) => `${film.title} - ${film.rating}/10`)
            .join("\n");
          await ctx.reply(`Ваши обзоры:\n${filmsList}`);
        } else {
          await ctx.reply("У вас пока нет добавленных фильмов.");
        }
      } else {
        await ctx.reply("Пользователь не найден.");
      }
    });
  }

  private async showFilms(username: string): Promise<Film[]> {
    const query = `
      SELECT title, genre, rating FROM film_reviews
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
}
