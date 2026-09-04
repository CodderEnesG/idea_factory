import { describe, it, expect } from "vitest";
import { PURSUE_STARTER_TASKS, starterTasksFor, validationToTaskBody } from "./task-templates";

/**
 * Girdi DB'den gelen ham JSONB — şema garantisi YOK (eski satırlar guard (d) eklenmeden önce
 * yazıldı). Bozuk veri kullanıcıya 500 döndürmemeli: "Kovala" kararı zaten yazılmış oluyor,
 * tohumlama onu geri almaz ama hata mesajı kullanıcıya kararın kaydedilmediğini düşündürür.
 */
describe("starterTasksFor", () => {
  it("geçerli validation_needed maddelerini göreve çevirir", () => {
    expect(
      starterTasksFor([{ data: "TR pazar büyüklüğü", why: "w", how_to_verify: "TÜİK raporu" }]),
    ).toEqual(["TR pazar büyüklüğü — TÜİK raporu"]);
  });

  it("how_to_verify yoksa yalnız data", () => {
    expect(starterTasksFor([{ data: "Kurucuyla görüş" }])).toEqual(["Kurucuyla görüş"]);
  });

  it("null/undefined → jenerik şablon", () => {
    expect(starterTasksFor(null)).toEqual([...PURSUE_STARTER_TASKS]);
    expect(starterTasksFor(undefined)).toEqual([...PURSUE_STARTER_TASKS]);
  });

  it("boş dizi → jenerik şablon", () => {
    expect(starterTasksFor([])).toEqual([...PURSUE_STARTER_TASKS]);
  });

  it("DİZİ OLMAYAN bozuk JSONB çökertmez, şablona düşer", () => {
    expect(starterTasksFor("bozuk")).toEqual([...PURSUE_STARTER_TASKS]);
    expect(starterTasksFor({ data: "obje" })).toEqual([...PURSUE_STARTER_TASKS]);
    expect(starterTasksFor(42)).toEqual([...PURSUE_STARTER_TASKS]);
  });

  it("bozuk MADDELER elenir; hiç geçerli kalmazsa şablona düşer", () => {
    expect(starterTasksFor([null, { why: "data yok" }, "string", { data: "   " }])).toEqual([
      ...PURSUE_STARTER_TASKS,
    ]);
  });

  it("karışık dizide yalnız geçerli maddeler kalır", () => {
    expect(starterTasksFor([null, { data: "İyi madde" }, { why: "kötü" }])).toEqual(["İyi madde"]);
  });

  it("how_to_verify string değilse yok sayılır", () => {
    expect(validationToTaskBody({ data: "X", how_to_verify: 5 as never })).toBe("X");
  });
});
