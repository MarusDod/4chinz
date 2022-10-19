export const boards: Record<string,string[]> = {
  "politics": ["pol"],
  "vidya": ["games","technology"],
  "adult": ["random","gif","ecchi","hentai"],
  "weebshit": ["anime"]
}

export const flatboards: string[] = Object.values(boards).flat()