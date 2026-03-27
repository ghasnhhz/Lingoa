require("dotenv").config({quiet: true});

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply(
        `Welcome! You are on the right path! 
         This app helps you remember what you learn by sending you quizzes and questions.
        `,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                          text: "Open Learning App",
                          web_app: { url: "https://www.npmjs.com/package/nodemon" }
                        }
                    ]
                ]
            }
        }
    );
});

bot.launch();

console.log("Bot is running...");