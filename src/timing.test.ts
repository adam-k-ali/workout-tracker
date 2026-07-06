import { exerciseMinutes, prescriptionFor, warmupMinutes } from "./timing.js";

describe("prescriptionFor", () => {
  it("returns cut compound prescription", () => {
    expect(prescriptionFor("compound", "cut")).toEqual({
      sets: 4,
      repRange: "8-12",
      restSeconds: 90,
    });
  });
});

describe("exerciseMinutes", () => {
  it("estimates wall-clock minutes for sets and rest", () => {
    expect(exerciseMinutes(4, 90)).toBe(9);
  });
});

describe("warmupMinutes", () => {
  it("scales warmup allowance to session length", () => {
    expect(warmupMinutes(30)).toBe(5);
  });
});
