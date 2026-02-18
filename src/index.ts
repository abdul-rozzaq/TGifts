import "dotenv/config";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

const apiId = parseInt(process.env.API_ID as string);
const apiHash = process.env.API_HASH as string;

const stringSession = new StringSession(process.env.STRING_SESSION || "");

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});


async function startPolling() {
  const INTERVAL = 300; // ms — keyin test bilan topamiz

  while (true) {
    const start = Date.now();

    try {
      // Api klasidan obyekt yaratib yuboramiz, shunda as any kerak bo'lmaydi
      await client.invoke(new Api.help.GetConfig()); // Parametrlar yo'q, shuning uchun bo'sh qoldiramiz

      const latency = Date.now() - start;
      console.log("OK | latency:", latency, "ms");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log("ERR:", err.message);

        // FloodWait bo‘lsa avtomatik kutish
        const tgErr = err as any;
        if (tgErr.seconds) {
          console.log("Flood wait:", tgErr.seconds, "s");
          await new Promise((r) => setTimeout(r, tgErr.seconds * 1000));
        }
      }
    }

    await new Promise((r) => setTimeout(r, INTERVAL));
  }
}


async function main() {
  await client.start({
    phoneNumber: async () => await rl.question("Telefon: "),
    password: async () => await rl.question("2FA: "),
    phoneCode: async () => await rl.question("Kod: "),
    onError: (err) => console.log(err.message),
  });

  console.log("Ulandi");
  console.log("Session:", client.session.save());

  startPolling();
}


main();
