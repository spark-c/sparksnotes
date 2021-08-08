## WidgetBotIO is a thing!

You can embed a discord 'server' in your webpage. Neat!

## Bots usually ignore each other

To get around this, you need to subclass commands.Bot. Where the bot normally ignores commands when message.author.bot, write a check to see if message.author.id == widgetbot's id.