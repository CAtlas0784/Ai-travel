export type VerifiedPlace = {
  name: string;
  description: string;
  category: string;
  address: string | null;
  openHours: string | null;
  entranceFee: string | null;
  sourceUrl: string | null;
  verifiedAt: Date | null;
};

function normalize(value: string) {
  return value.toLocaleLowerCase("th").replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function selectRelevantPlaces(question: string, places: VerifiedPlace[], limit = 12) {
  if (limit <= 0) return [];
  const normalizedQuestion = normalize(question);
  if (!normalizedQuestion) return places.slice(0, limit);

  const ranked = places
    .map((place, index) => {
      const aliases = [place.name, ...[...place.name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1])];
      const nameMatch = aliases.some((alias) => normalizedQuestion.includes(normalize(alias)));
      const categoryMatch = normalizedQuestion.includes(normalize(place.category));
      return { place, index, score: (nameMatch ? 100 : 0) + (categoryMatch ? 20 : 0) };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index);

  return (ranked.length > 0 ? ranked.map((entry) => entry.place) : places).slice(0, limit);
}

export function buildTravelContext(question: string, places: VerifiedPlace[]) {
  const selectedPlaces = selectRelevantPlaces(question, places);
  if (selectedPlaces.length === 0) {
    return "No verified place records are available. Do not invent place-specific facts, opening hours, fees, ratings, or addresses.";
  }

  const records = selectedPlaces.map((place) => ({
    name: place.name,
    category: place.category,
    description: place.description,
    address: place.address,
    openHours: place.openHours,
    entranceFee: place.entranceFee,
    sourceUrl: place.sourceUrl,
    verifiedAt: place.verifiedAt?.toISOString().slice(0, 10) ?? null
  }));

  return [
    "Verified place records (JSON). Treat null fields as unknown; never guess missing hours, fees, ratings, or addresses.",
    "Use only these records for place-specific factual claims. If a sourceUrl exists, cite it as a Markdown link next to the relevant claim.",
    JSON.stringify(records, null, 2)
  ].join("\n\n");
}
