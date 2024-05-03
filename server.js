import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import fastifyView from "@fastify/view";
import ejs from "ejs";
import fastifyPostgres from "@fastify/postgres";
import fastifyFormbody from "@fastify/formbody";
import fastifyCookie from "@fastify/cookie";
import { randomUUID } from "node:crypto";
import fastifySession from "@fastify/session";
import AuthRoutes from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sessions = [];

export default async function createServer() {
  const app = fastify({
    logger: {
      transport: {
        target: "pino-pretty",
      },
    },
  });

  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: "opirtu0435ljhf6546ziuetfdfggdfgdvw45345tsdfdfgdfgdfgdff",
    cookie: {
      secure: false,
    },
  });

  await app.register(fastifyStatic, {
    root: join(__dirname, "assets"),
    prefix: "/static",
  });

  await app.register(fastifyView, {
    engine: {
      ejs: ejs,
    },
    layout: "./template.ejs",
  });

  await app.register(fastifyFormbody);

  await app.register(fastifyPostgres, {
    connectionString: "postgres://postgres:password@localhost/cled",
  });

  await app.register(AuthRoutes);

  app.get("/login", async (req, res) => {
    return res.view("./views/login.ejs", { message: undefined });
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const queryRes = await app.pg.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (queryRes.rows.length !== 1) {
      const message = "Credenziali errate";
      return res.view("./views/login.ejs", { message });
    }

    req.session.set("user", queryRes.rows[0]);
    res.redirect("/");
  });

  return app;
}
