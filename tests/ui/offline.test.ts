import { expect, test } from "vitest";
import { queueWrite, antreanTerkirim } from "@/lib/offline-queue";
test("tulis offline masuk antrean", () => {
  queueWrite({ type: "task.toggle", id: "t1" });
  expect(antreanTerkirim().length).toBe(1);
});
