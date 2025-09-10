import mongoose from "mongoose";
import {
  AnalyticsEvent,
  AnalyticsEventSchema,
} from "../src/analytics/schemas/analytics-event.schema";

async function seed() {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/kitejs-analytics";

  await mongoose.connect(uri);

  const EventModel = mongoose.model(AnalyticsEvent.name, AnalyticsEventSchema);

  const now = new Date();
  const sample = [
    {
      type: "pageview",
      payload: { url: "/" },
      origin: "web",
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ip: "127.0.0.1",
      createdAt: now,
    },
    {
      type: "signup",
      payload: { plan: "pro" },
      origin: "web",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
      ip: "127.0.0.2",
      createdAt: new Date(now.getTime() - 3600 * 1000),
    },
  ];

  await EventModel.insertMany(sample);
  console.log(`Inserted ${sample.length} analytics events`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
