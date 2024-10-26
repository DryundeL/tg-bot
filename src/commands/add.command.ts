import { Markup, Telegraf } from "telegraf";
import { Command } from "./command.class";
import { Review, IBotContext } from "../context/context.interface";
import pool from "../db/db.config";
import {
  CallbackQuery,
  InlineKeyboardButton,
} from "telegraf/typings/core/types/typegram";

enum AddReviewStep {
  TYPE = "TYPE",
  TITLE = "TITLE",
  GENRE = "GENRE",
  RATING = "RATING",
}

const enumValues = Object.values(AddReviewStep);

type CaseForms = {
  [key: string]: { genitive: string };
};

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

  private dictionary: CaseForms = {
    фильм: { genitive: "фильма" },
    сериал: { genitive: "сериала" },
    аниме: { genitive: "аниме" },
    дорама: { genitive: "дорамы" },
    манга: { genitive: "манги" },
    манхва: { genitive: "манхвы" },
    маньхуа: { genitive: "маньхуа" },
  };

  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  private toGenitive(text: string): string {
    const words = text.split(" ");
    const genitiveWords = words.map((word) => {
      const lowerWord = word.toLowerCase();
      return this.dictionary[lowerWord]?.genitive || word;
    });
    return genitiveWords.join(" ");
  }

  handle(): void {
    this.bot.action("add_review", async (ctx) => {
      ctx.session.reviewStep = AddReviewStep.TYPE;
      ctx.session.review = {
        id: undefined,
        username: ctx.from?.username,
        type: "",
        title: "",
        genre: "",
        rating: 0,
      };

      await this.displayStep(ctx, AddReviewStep.TYPE);
    });

    this.bot.action(/^(type|genre|rating)_\d+$/, async (ctx) => {
      const callbackQuery = ctx.callbackQuery as CallbackQuery;

      if ("data" in callbackQuery) {
        const [step, index] = callbackQuery.data.split("_");
        const stepIndex = parseInt(index, 10);

        if (!ctx.session.review) {
          ctx.session.review = {
            id: undefined,
            username: ctx.from?.username,
            type: "",
            title: "",
            genre: "",
            rating: 0,
          };
        }

        switch (step) {
          case "type":
            ctx.session.review.type = this.types[stepIndex];
            ctx.session.reviewStep = AddReviewStep.TITLE;
            await this.displayStep(ctx, AddReviewStep.TITLE);
            break;
          case "genre":
            ctx.session.review.genre = this.genres[stepIndex];
            ctx.session.reviewStep = AddReviewStep.RATING;
            await this.displayStep(ctx, AddReviewStep.RATING);
            break;
          case "rating":
            ctx.session.review.rating = stepIndex + 1;
            await this.saveReview(ctx.session.review, ctx.from?.username);
            await ctx.editMessageText(
              `Обзор на ${this.toGenitive(ctx.session.review.type)} "${ctx.session.review.title}" добавлен с рейтингом ${ctx.session.review.rating}/10 в жанре "${ctx.session.review.genre}".`,
              Markup.inlineKeyboard([
                Markup.button.callback("⬅️ В главное меню", "back_to_menu"),
              ]),
            );
            this.resetSession(ctx);
            break;
        }
      }
    });

    this.bot.action(/^back_to_(type|title|genre)$/, async (ctx) => {
      const currentStep = ctx.session.reviewStep;
      const prevStep = this.getPreviousEnumValue(currentStep);

      switch (prevStep) {
        case "TYPE": {
          ctx.session.reviewStep = AddReviewStep.TYPE;
          await this.displayStep(ctx, AddReviewStep.TYPE);
          break;
        }
        case "TITLE": {
          ctx.session.reviewStep = AddReviewStep.TITLE;
          await this.displayStep(ctx, AddReviewStep.TITLE);
          break;
        }

        case "GENRE": {
          ctx.session.reviewStep = AddReviewStep.GENRE;
          await this.displayStep(ctx, AddReviewStep.GENRE);
          break;
        }
      }
    });

    this.bot.on("text", async (ctx) => {
      if (ctx.session.reviewStep === AddReviewStep.TITLE) {
        if (!ctx.session.review) {
          ctx.session.review = {
            id: undefined,
            username: ctx.from?.username,
            type: "",
            title: "",
            genre: "",
            rating: 0,
          };
        }

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
          ctx.session.review.title = ctx.message.text;
          ctx.session.reviewStep = AddReviewStep.GENRE;
          await this.displayStep(ctx, AddReviewStep.GENRE);
        }
      }
    });
  }

  private async displayStep(ctx: IBotContext, step: AddReviewStep) {
    if (!ctx.session.review) {
      ctx.session.review = {
        id: undefined,
        username: ctx.from?.username,
        type: "",
        title: "",
        genre: "",
        rating: 0,
      };
    }

    let message = "";
    let buttons: InlineKeyboardButton[][] = [];

    switch (step) {
      case AddReviewStep.TYPE:
        message = "Выберите предмет обзора:";
        buttons = this.types.map((type, index) => [
          Markup.button.callback(type, `type_${index}`),
        ]);
        buttons.unshift([
          Markup.button.callback("⬅️ В главное меню", "back_to_menu"),
        ]);
        await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
        break;

      case AddReviewStep.TITLE:
        message = `Введите название ${this.toGenitive(ctx.session.review?.type)}, который(ое) хотите добавить:`;
        buttons = [[Markup.button.callback("⬅️ Назад", "back_to_type")]];
        await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
        break;

      case AddReviewStep.GENRE:
        message = `Выберите жанр "${ctx.session.review?.title}":`;
        buttons = [
          [Markup.button.callback("⬅️ Назад", "back_to_title")],
          ...this.genres.map((genre, index) => [
            Markup.button.callback(genre, `genre_${index}`),
          ]),
        ];
        await ctx.reply(message, Markup.inlineKeyboard(buttons)); // Используем ctx.reply вместо ctx.editMessageText
        break;

      case AddReviewStep.RATING:
        message = "Выберите рейтинг обзора:";
        buttons = [
          [Markup.button.callback("⬅️ Назад", "back_to_genre")],
          ...Array.from({ length: 10 }, (_, i) =>
            Markup.button.callback(`${i + 1}`, `rating_${i}`),
          ).reduce<InlineKeyboardButton[][]>((acc, button, index) => {
            if (index % 4 === 0) acc.push([]);
            acc[acc.length - 1].push(button);
            return acc;
          }, []),
        ];
        await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
        break;
    }
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

  private getPreviousEnumValue(
    currentValue: AddReviewStep | undefined,
  ): AddReviewStep | undefined {
    if (currentValue !== undefined) {
      const currentIndex = enumValues.indexOf(currentValue);
      if (currentIndex > 0) {
        return enumValues[currentIndex - 1] as AddReviewStep;
      }
    }
    return undefined;
  }

  private resetSession(ctx: IBotContext) {
    delete ctx.session.reviewStep;
    delete ctx.session.review;
  }
}
