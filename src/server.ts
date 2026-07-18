import app, { initApp } from "./app.js";

const PORT = process.env.PORT || 3000;

(async () => {
  await initApp();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
