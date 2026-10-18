import "dotenv/config";
import { openStore } from "../server/store";

// Local operator command only. There is deliberately no public administration API.
const store = openStore(
  process.env.DATABASE_PATH || "./data/inquiries.sqlite",
  process.env.RATE_LIMIT_SECRET || "local-operator-command",
);
try {
  if (process.argv.includes("--prune")) {
    store.prune();
    console.info("Retention cleanup complete.");
  } else if (process.argv.includes("--delete")) {
    const id = process.argv[process.argv.indexOf("--delete") + 1];
    if (!id || !/^[0-9a-f-]{36}$/i.test(id))
      throw new Error("Usage: npm run inquiries -- --delete <inquiry-uuid>");
    const result = store.db
      .prepare("DELETE FROM inquiries WHERE id = ?")
      .run(id);
    console.info(`Deleted ${result.changes} inquiry.`);
  } else {
    const limit = process.argv.includes("--all") ? 10000 : 50;
    const rows = store.db
      .prepare("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT ?")
      .all(limit);
    console.log(JSON.stringify(rows, null, 2));
  }
} finally {
  store.close();
}
