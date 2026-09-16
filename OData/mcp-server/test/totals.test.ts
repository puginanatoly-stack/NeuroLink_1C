import { describe, it, expect } from "vitest";
import { carriedRowFields, rowsSum, sectionRows, type GoodsLine } from "../src/tools/write.js";

const line = (over: Partial<GoodsLine> = {}): GoodsLine => ({
  nomenclatureRef: "nom-1",
  quantity: 2,
  price: 100,
  vatRate: "НДС20",
  ...over,
});

/** Строка документа, какой её отдаёт 1С: с уже посчитанным налогом. */
const sourceRow = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  LineNumber: 1,
  Номенклатура_Key: "nom-1",
  Количество: 2,
  Цена: 100,
  Сумма: 200,
  СтавкаНДС: "НДС20",
  СуммаНДС: 33.33,
  ...over,
});

describe("sectionRows", () => {
  it("отдаёт строки заполненной табличной части", () => {
    const doc = { Товары: [sourceRow()], Услуги: [] };
    expect(sectionRows(doc, "Товары")).toHaveLength(1);
  });

  it("пустая или отсутствующая ТЧ — пустой массив, а не падение", () => {
    expect(sectionRows({}, "Услуги")).toEqual([]);
    expect(sectionRows({ Услуги: [] }, "Услуги")).toEqual([]);
  });
});

describe("rowsSum", () => {
  it("складывает «Сумму» строк с округлением до копеек", () => {
    const rows = [{ Сумма: 10.005 }, { Сумма: 20.005 }];
    expect(rowsSum(rows)).toBe(30.01);
  });

  it("строки без «Суммы» считаются нулевыми", () => {
    expect(rowsSum([{ Сумма: 100 }, {}])).toBe(100);
  });

  it("суммы строками (OData отдаёт и так) тоже складываются", () => {
    expect(rowsSum([{ Сумма: "150.50" }, { Сумма: 49.5 }])).toBe(200);
  });

  it("пустая ТЧ даёт ноль — вторая часть смешанного документа ничего не добавит", () => {
    expect(rowsSum([])).toBe(0);
  });
});

describe("carriedRowFields — перенос суммы НДС", () => {
  it("количество/цена/ставка не менялись — прежний налог сохраняется", () => {
    const carried = carriedRowFields(line({ source: sourceRow() }));
    expect(carried["СуммаНДС"]).toBe(33.33);
  });

  it("изменилось количество — налог не переносим, он посчитан на старое", () => {
    const carried = carriedRowFields(line({ quantity: 5, source: sourceRow() }));
    expect(carried["СуммаНДС"]).toBeUndefined();
  });

  it("изменилась цена — налог не переносим", () => {
    const carried = carriedRowFields(line({ price: 999, source: sourceRow() }));
    expect(carried["СуммаНДС"]).toBeUndefined();
  });

  it("изменилась ставка — налог не переносим", () => {
    const carried = carriedRowFields(line({ vatRate: "БезНДС", source: sourceRow() }));
    expect(carried["СуммаНДС"]).toBeUndefined();
  });

  it("у новой строки (без исходной) налога нет", () => {
    expect(carriedRowFields(line())["СуммаНДС"]).toBeUndefined();
  });

  it("в исходной строке была скидка — налог не переносим: он не от нашей суммы", () => {
    // Сумму строки мы считаем как 2×100=200, а в 1С она была 180 (ручная скидка),
    // поэтому прежние 30 рублей налога к пересчитанной сумме не относятся.
    const carried = carriedRowFields(line({ source: sourceRow({ Сумма: 180, СуммаНДС: 30 }) }));
    expect(carried["СуммаНДС"]).toBeUndefined();
  });

  it("пересчитываемые поля по-прежнему отбрасываются", () => {
    const carried = carriedRowFields(line({ source: sourceRow({ СуммаСНДС: 200 }) }));
    expect(carried["Сумма"]).toBeUndefined();
    expect(carried["LineNumber"]).toBeUndefined();
    expect(carried["СуммаСНДС"]).toBeUndefined();
  });
});
