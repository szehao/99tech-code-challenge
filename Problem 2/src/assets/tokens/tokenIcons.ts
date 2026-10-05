// Icons sourced from https://github.com/Switcheo/token-icons (tokens/<SYMBOL>.svg).
const iconUrls = import.meta.glob<string>("./*.svg", { eager: true, query: "?url", import: "default" });

export function getTokenIconUrl(symbol: string): string | undefined {
  return iconUrls[`./${symbol}.svg`];
}
