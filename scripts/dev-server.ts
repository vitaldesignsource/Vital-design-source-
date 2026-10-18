process.env.NODE_ENV = "development";
process.env.SITE_URL ||= "http://localhost:5173";
await import("../server/index");
export {};
