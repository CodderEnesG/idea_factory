/** Sağlayıcı-bağımsız analist arayüzü. Tek atış: (system, user, şema) → parse edilmiş JSON. */
export interface GenerateArgs {
  system: string;
  user: string;
  jsonSchema: Record<string, unknown>;
}

export interface AnalystProvider {
  readonly name: string;
  /** Yapısal JSON üret. zod doğrulama + guard'lar çağıran tarafta (analyst.ts). */
  generate(args: GenerateArgs): Promise<unknown>;
}
