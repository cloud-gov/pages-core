import { config } from "dotenv";
import sirv from "sirv";
import polka from "polka";
import compression from "compression";
import * as sapper from "@sapper/server";

config();

const {
  GITHUB_OAUTH_CLIENT_ID,
  NODE_ENV,
  PORT,
  REDIRECT_BASE_URL,
} = process.env;

const dev = NODE_ENV === "development";

polka() // You can also use Express
  .use(
    compression({ threshold: 0 }),
    sirv("static", { dev }),
    sapper.middleware({
      session: () => ({
        GITHUB_OAUTH_CLIENT_ID,
        REDIRECT_BASE_URL,
      }),
    })
  )
  .listen(PORT, (err) => {
    if (err) console.log("error", err);
  });
