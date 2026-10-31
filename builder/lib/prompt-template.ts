/** Substitute `${KEY}` placeholders and reject drift in either direction. */
export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  const placeholderRe = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const seen = new Set<string>();
  const result = template.replace(placeholderRe, (_match, key: string) => {
    seen.add(key);
    if (!(key in vars)) {
      throw new Error(`Prompt template references unknown placeholder \${${key}}`);
    }
    return String(vars[key]);
  });
  for (const key of Object.keys(vars)) {
    if (!seen.has(key)) {
      throw new Error(`Prompt template never used variable ${key}; check for drift`);
    }
  }
  return result;
}
