import { describe, it, expect } from "vitest";
import {
  buildGoodsRows,
  buildInvoiceRows,
  carriedRowFields,
  lineFromRow,
  splitAccountRefs,
  type GoodsLine,
} from "../src/tools/write.js";

/** Счета строки в тестах не резолвим — проверяем сами строки. */
const noAccounts = (): Record<string, string> => ({});

const line = (over: Partial<GoodsLine> = {}): GoodsLine => ({
  nomenclatureRef: "nom-1",
  quantity: 2,
  price: 100,
  vatRate: "БезНДС",
  ...over,
});

describe("buildGoodsRows", () => {
  it("пишет содержание строки в реквизит «Содержание»", () => {
    const rows = buildGoodsRows([line({ content: "Услуги за июль 2026 г." })], noAccounts);
    expect(rows[0]?.["Содержание"]).toBe("Услуги за июль 2026 г.");
  });

  it("не отправляет «Содержание», если оно не задано", () => {
    const rows = buildGoodsRows([line()], noAccounts);
    expect(rows[0]).not.toHaveProperty("Содержание");
  });

  it("нумерует строки с 1 и считает сумму с округлением до копеек", () => {
    const rows = buildGoodsRows([line({ quantity: 3, price: 33.333 }), line()], noAccounts);
    expect(rows.map((r) => r["LineNumber"])).toEqual([1, 2]);
    expect(rows[0]?.["Сумма"]).toBe(100);
    expect(rows[1]?.["Сумма"]).toBe(200);
  });

  it("подмешивает счета, вычисленные для строки", () => {
    const rows = buildGoodsRows([line()], (l) => ({
      СчетДоходов_Key: `income-for-${l.nomenclatureRef}`,
    }));
    expect(rows[0]?.["СчетДоходов_Key"]).toBe("income-for-nom-1");
  });
});

describe("buildInvoiceRows", () => {
  it("пишет «Содержание» и полиморфную ссылку на номенклатуру", () => {
    const rows = buildInvoiceRows([line({ content: "Доставка СДЭК" })]);
    expect(rows[0]?.["Содержание"]).toBe("Доставка СДЭК");
    expect(rows[0]?.["Номенклатура"]).toBe("nom-1");
    expect(rows[0]?.["Номенклатура_Type"]).toBe("StandardODATA.Catalog_Номенклатура");
  });
});

describe("splitAccountRefs", () => {
  const guid = "1a2b3c4d-1111-2222-3333-444455556666";

  it("коды плана счетов уходят на поиск в базе", () => {
    const { refs, codes } = splitAccountRefs(["90.01.2", "90.02.2"]);
    expect(codes).toEqual(["90.01.2", "90.02.2"]);
    expect(refs.size).toBe(0);
  });

  it("готовый GUID берётся как есть, фигурные скобки снимаются", () => {
    const { refs, codes } = splitAccountRefs([`{${guid}}`]);
    expect(codes).toEqual([]);
    expect(refs.get(`{${guid}}`)).toBe(guid);
  });

  it("пропускает пустые значения, чистит пробелы и не дублирует коды", () => {
    const { refs, codes } = splitAccountRefs([undefined, "", "  ", " 90.01.2 ", "90.01.2"]);
    expect(codes).toEqual(["90.01.2"]);
    expect(refs.size).toBe(0);
  });
});

describe("lineFromRow + carriedRowFields", () => {
  const row = {
    LineNumber: 1,
    Номенклатура_Key: "nom-7",
    Содержание: "Услуги по договору № 87",
    Количество: 1,
    Цена: 50000,
    Сумма: 50000,
    СуммаНДС: 8333.33,
    СтавкаНДС: "НДС20",
    СчетДоходов_Key: "acc-90-01-2",
    СчетРасходов_Key: "acc-90-02-2",
    НоменклатурнаяГруппа_Key: "grp-1",
    Ref_Key: "doc-1",
  };

  it("разбирает строку документа, поднимая содержание и счета в поля строки", () => {
    const l = lineFromRow(row);
    expect(l).toMatchObject({
      nomenclatureRef: "nom-7",
      quantity: 1,
      price: 50000,
      vatRate: "НДС20",
      content: "Услуги по договору № 87",
      incomeAccount: "acc-90-01-2",
      expenseAccount: "acc-90-02-2",
    });
  });

  it("считает пустой GUID отсутствующим счётом", () => {
    const l = lineFromRow({ ...row, СчетДоходов_Key: "00000000-0000-0000-0000-000000000000" });
    expect(l.incomeAccount).toBeUndefined();
  });

  it("переносит неуправляемые поля строки и отбрасывает пересчитываемые", () => {
    const carried = carriedRowFields(lineFromRow(row));
    expect(carried["НоменклатурнаяГруппа_Key"]).toBe("grp-1");
    // Количество/цена/ставка не менялись — прежний налог верен и переносится
    // (иначе строка документа с НДС уехала бы в 1С с нулевым налогом).
    expect(carried["СуммаНДС"]).toBe(8333.33);
    expect(carried).not.toHaveProperty("Сумма");
    expect(carried).not.toHaveProperty("LineNumber");
    expect(carried).not.toHaveProperty("Ref_Key");
  });

  it("для новой строки (без исходной) ничего не переносит", () => {
    expect(carriedRowFields(line())).toEqual({});
  });

  it("пересборка ТЧ сохраняет содержание и номенклатурную группу прежних строк", () => {
    // Сценарий add_document_line: прежняя строка из документа + новая от пользователя.
    const rows = buildGoodsRows([lineFromRow(row), line({ nomenclatureRef: "nom-new" })], noAccounts);
    expect(rows[0]?.["Содержание"]).toBe("Услуги по договору № 87");
    expect(rows[0]?.["НоменклатурнаяГруппа_Key"]).toBe("grp-1");
    expect(rows[0]?.["LineNumber"]).toBe(1);
    // Прежняя строка не тронута — её налог сохраняется; у новой строки его нет.
    expect(rows[0]?.["СуммаНДС"]).toBe(8333.33);
    expect(rows[1]?.["Номенклатура_Key"]).toBe("nom-new");
    expect(rows[1]?.["LineNumber"]).toBe(2);
    expect(rows[1]).not.toHaveProperty("СуммаНДС");
  });

  it("не затирает перенесённое содержание, если content в строке не задан", () => {
    const withoutContent: GoodsLine = { ...lineFromRow(row), content: undefined };
    const rows = buildGoodsRows([withoutContent], noAccounts);
    expect(rows[0]?.["Содержание"]).toBe("Услуги по договору № 87");
  });

  it("новые значения строки перекрывают перенесённые из исходной", () => {
    const changed: GoodsLine = { ...lineFromRow(row), quantity: 3, content: "Новый текст" };
    const rows = buildGoodsRows([changed], noAccounts);
    expect(rows[0]?.["Количество"]).toBe(3);
    expect(rows[0]?.["Сумма"]).toBe(150000);
    expect(rows[0]?.["Содержание"]).toBe("Новый текст");
  });
});
