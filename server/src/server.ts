import { app } from "./app.js";
import { getDb } from "./db/client.js";
import { seedDatabase } from "./db/seed.js";
import { operationsService } from "./services/operations.service.js";

const port = Number(process.env.API_PORT || 3001);

getDb();
seedDatabase();
operationsService.startLifecycleLoop();

app.listen(port, () => {
  console.log(`Rapid Rescue Grid API running on http://localhost:${port}`);
});
