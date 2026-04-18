import { app } from "./app";
import { envConfig } from "./shared/config/env.config";

app.listen(envConfig.port, () => {
  console.log(`Backend server listening on port ${envConfig.port}`);
});