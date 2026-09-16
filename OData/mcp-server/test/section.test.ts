import { describe, it, expect } from "vitest";
import { pickSection } from "../src/tools/write.js";

const row = { LineNumber: 1, Номенклатура_Key: "nom-1" };
const goods = { servicesAct: false } as const;

describe("pickSection", () => {
  it("заполненные «Услуги» — правим именно их", () => {
    expect(pickSection({ goods: [], services: [row] }, goods)).toBe("Услуги");
  });

  it("заполненные «Товары» — правим их", () => {
    expect(pickSection({ goods: [row], services: [] }, goods)).toBe("Товары");
  });

  it("акт об оказании услуг — «Услуги» даже без строк", () => {
    expect(pickSection({ goods: [], services: [] }, { servicesAct: true })).toBe("Услуги");
  });

  it("реализация с видом операции «Услуги» и пустыми ТЧ — «Услуги»", () => {
    expect(pickSection({}, { servicesAct: false, operationKind: "Услуги" })).toBe("Услуги");
  });

  it("реализация товаров по умолчанию — «Товары»", () => {
    expect(pickSection({}, { servicesAct: false, operationKind: "ТоварыИУслуги" })).toBe("Товары");
  });

  it("факт важнее вида операции: строки лежат в «Услугах»", () => {
    // Документ мог быть переключён на услуги после заполнения — верим строкам.
    expect(pickSection({ services: [row] }, { servicesAct: false, operationKind: "ТоварыИУслуги" })).toBe(
      "Услуги",
    );
  });

  it("документ без ТЧ и без подсказок — «Товары»", () => {
    expect(pickSection({}, { servicesAct: false })).toBe("Товары");
  });
});
