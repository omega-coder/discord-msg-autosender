const dotenv = require("dotenv");
dotenv.config();

module.exports = {
    discord_password: process.env.DISCORD_PASSWORD,
    discord_user: process.env.DISCORD_USER,
    discord_channel_url: process.env.DISCORD_CHANNEL_URL
};