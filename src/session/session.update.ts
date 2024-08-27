import { join } from "path";
import { promises as fs } from "fs";

async function deleteOldSessions() {
  const filePath = join(__dirname, "..", "..", "sessions.json"); // Путь к файлу от корня проекта

  try {
    await fs.unlink(filePath);
    console.log("sessions.json удален.");
  } catch (error) {
    console.log(error);
  }
}

// Вызов функции
deleteOldSessions();
