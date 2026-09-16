import { describe, it, expect } from "vitest";
import { stripForCopy, applyLineOverrides, totalFromRows } from "../src/tools/write.js";
import { InputError } from "../src/errors.js";

const doc = {
  "odata.metadata": "https://…/$metadata#Document_СчетНаОплатуПокупателю/@Element",
  Ref_Key: "doc-1",
  Number: "0000-002922",
  Date: "2026-07-10T00:00:00",
  Posted: true,
  DeletionMark: false,
  DataVersion: "AAAAAAAAAAA=",
  СсылочныйИдентификатор: "EC2B357007365936",
  Организация_Key: "org-1",
  Контрагент_Key: "cp-1",
  СуммаДокумента: 8750,
  "ЗаголовокСчета@navigationLinkUrl": "Document_…(guid'doc-1')/ЗаголовокСчета",
  ЗаголовокСчета_Key: "hdr-1",
  Товары: [
    {
      LineNumber: "1",
      Ref_Key: "doc-1",
      ИдентификаторСтроки: "row-uuid",
      ИдентификаторРодительскойСтроки: "",
      Номенклатура: "nom-1",
      Содержание: "Дизайн … за июнь 2026 г.",
      Количество: 3.5,
      Цена: 2500,
      Сумма: 8750,
    },
  ],
};

describe("stripForCopy", () => {
  const copy = stripForCopy(doc);

  it("выбрасывает служебные реквизиты исходного документа", () => {
    for (const k of ["Ref_Key", "Number", "Posted", "DeletionMark", "DataVersion"]) {
      expect(copy).not.toHaveProperty(k);
    }
    expect(copy).not.toHaveProperty("СсылочныйИдентификатор");
  });

  it("выбрасывает технические ключи OData", () => {
    expect(copy).not.toHaveProperty("odata.metadata");
    expect(copy).not.toHaveProperty("ЗаголовокСчета@navigationLinkUrl");
  });

  it("сохраняет содержательные реквизиты — ради них копия и делается", () => {
    expect(copy["Организация_Key"]).toBe("org-1");
    expect(copy["ЗаголовокСчета_Key"]).toBe("hdr-1");
    expect(copy["СуммаДокумента"]).toBe(8750);
  });

  it("чистит идентификаторы строк табличной части", () => {
    const row = (copy["Товары"] as Array<Record<string, unknown>>)[0]!;
    expect(row).not.toHaveProperty("Ref_Key");
    expect(row).not.toHaveProperty("ИдентификаторСтроки");
    expect(row).not.toHaveProperty("ИдентификаторРодительскойСтроки");
    expect(row["Содержание"]).toBe("Дизайн … за июнь 2026 г.");
  });

  it("не портит исходный объект", () => {
    expect(doc.Товары[0]?.ИдентификаторСтроки).toBe("row-uuid");
  });
});

describe("applyLineOverrides", () => {
  const rows = [
    { LineNumber: "1", Количество: 3.5, Сумма: 8750, Содержание: "за июнь" },
    { LineNumber: "2", Количество: 1, Сумма: 10000, Содержание: "за июнь" },
  ];

  it("правит указанную строку, остальные копирует как есть", () => {
    const out = applyLineOverrides(rows, [
      { lineNumber: 1, fields: { Количество: 4.3, Сумма: 10750, Содержание: "за июль" } },
    ]);
    expect(out[0]).toMatchObject({ Количество: 4.3, Сумма: 10750, Содержание: "за июль" });
    expect(out[1]).toEqual(rows[1]);
  });

  it("несуществующий номер строки — ошибка ввода, а не тихий пропуск", () => {
    expect(() => applyLineOverrides(rows, [{ lineNumber: 3, fields: { Сумма: 1 } }])).toThrow(InputError);
    expect(() => applyLineOverrides(rows, [{ lineNumber: 3, fields: { Сумма: 1 } }])).toThrow(
      /В документе 2 строк\(и\), а правка задана для строки 3/,
    );
  });

  it("не мутирует исходные строки", () => {
    applyLineOverrides(rows, [{ lineNumber: 1, fields: { Количество: 99 } }]);
    expect(rows[0]?.Количество).toBe(3.5);
  });
});

describe("totalFromRows", () => {
  it("складывает суммы строк с округлением до копеек", () => {
    expect(totalFromRows([{ Сумма: 10750 }, { Сумма: 0.005 }])).toBe(10750.01);
  });

  it("принимает суммы строками — OData отдаёт числа и так, и так", () => {
    expect(totalFromRows([{ Сумма: "10000" }, { Сумма: 750 }])).toBe(10750);
  });

  it("без «Суммы» хотя бы в одной строке пересчёт невозможен", () => {
    expect(totalFromRows([{ Сумма: 100 }, { Количество: 1 }])).toBeUndefined();
  });

  it("документ без строк даёт ноль", () => {
    expect(totalFromRows([])).toBe(0);
  });
});
