export interface CreatureSprites {
  moods: Record<string, string>;
  egg: string;
  dead: string;
}

export interface CreatureDefinition {
  type: string;
  sprites: CreatureSprites;
}

const SLUG_SPRITES: CreatureSprites = {
  moods: {
    happy: "/sprites/slug/slug-happy.png",
    amazed: "/sprites/slug/slug-amazed.png",
    impressed: "/sprites/slug/slug-impressed.png",
    worried: "/sprites/slug/slug-worried.png",
    judgemental: "/sprites/slug/slug-judgemental.png",
    existential: "/sprites/slug/slug-existential.png",
    hungry: "/sprites/slug/slug-hungry.png",
    dying: "/sprites/slug/slug-dying.png",
    ghost: "/sprites/slug/slug-dead.png",
    vacation: "/sprites/slug/slug-vacation.png",
    weekend: "/sprites/slug/slug-happy.png",
  },
  egg: "/sprites/slug/slug-base.png",
  dead: "/sprites/slug/slug-dead.png",
};

const SLUG_DEFINITION: CreatureDefinition = {
  type: "slug",
  sprites: SLUG_SPRITES,
};

const REGISTRY: Record<string, CreatureDefinition> = {
  slug: SLUG_DEFINITION,
};

export function getCreatureDefinition(type: string): CreatureDefinition {
  return REGISTRY[type] ?? SLUG_DEFINITION;
}

export function getSpriteForMood(def: CreatureDefinition, mood: string): string {
  return def.sprites.moods[mood] ?? def.sprites.moods.happy;
}
