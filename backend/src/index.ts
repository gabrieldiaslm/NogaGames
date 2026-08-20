import "dotenv/config";
import { createApp } from "./app.js";

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 16) {
  throw new Error(
    "JWT_SECRET ausente ou fraco: configure um segredo forte (min. 16 caracteres) no ambiente antes de iniciar.",
  );
}

const port = Number(process.env.PORT ?? 3000);

const app = createApp();

app.listen(port, () => {
  console.log(`NogaGames API rodando em http://localhost:${port}`);
});