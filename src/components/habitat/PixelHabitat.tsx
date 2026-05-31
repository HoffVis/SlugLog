import { useState } from "react";
import { getCreatureDefinition, getSpriteForMood } from "./creatureRegistry";
import { getSlugMessage } from "../SlugMood";
import type { CreatureState } from "../../lib/types";
import type { SlugMoodType } from "../SlugMood";
import "./PixelHabitat.css";

interface PixelHabitatProps {
  state: CreatureState;
  size?: "small" | "large";
  onClick?: () => void;
}

function getMoodScene(mood: string): string {
  switch (mood) {
    case "amazed": return "scene-amazed";
    case "impressed": return "scene-impressed";
    case "happy":
    case "weekend": return "scene-healthy";
    case "worried": return "scene-worried";
    case "judgemental": return "scene-judgemental";
    case "existential": return "scene-existential";
    case "hungry": return "scene-hungry";
    case "dying": return "scene-dying";
    case "ghost": return "scene-dead";
    case "vacation": return "scene-vacation";
    default: return "scene-healthy";
  }
}

function getMoodAnim(mood: string, lifecycle: string): string {
  if (lifecycle === "dead" || mood === "ghost") return "slug-float";
  if (mood === "dying") return "slug-wobble";
  if (mood === "amazed") return "slug-bounce";
  if (mood === "existential") return "slug-sway";
  if (mood === "hungry") return "slug-shiver";
  if (mood === "vacation") return "slug-chill";
  return "slug-breathe";
}

export function PixelHabitat({ state, size = "small", onClick }: PixelHabitatProps) {
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);

  const def = getCreatureDefinition(state.creature?.creature_type ?? "slug");

  let spriteSrc: string;
  if (state.lifecycle === "egg") {
    spriteSrc = def.sprites.egg;
  } else if (state.lifecycle === "dead") {
    spriteSrc = def.sprites.dead;
  } else {
    spriteSrc = getSpriteForMood(def, state.mood);
  }

  const sceneClass = getMoodScene(state.mood);
  const animClass = getMoodAnim(state.mood, state.lifecycle);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (state.lifecycle === "alive" && state.creature) {
      const mood = state.mood as SlugMoodType;
      const msg = getSlugMessage(mood);
      const name = state.creature.name;
      setSpeechBubble(name ? `${name}: ${msg}` : msg);
      setTimeout(() => setSpeechBubble(null), 3000);
    }
  };

  return (
    <div className={`pixel-habitat pixel-habitat-${size}`} onClick={handleClick}>
      <div className={`pixel-habitat-scene ${sceneClass}`}>
        <div className="pixel-habitat-particles" />
        <img
          src={spriteSrc}
          alt={`Slug mood: ${state.mood}`}
          className={`pixel-habitat-sprite ${animClass}`}
          draggable={false}
        />
      </div>
      {speechBubble && (
        <div className="pixel-habitat-bubble">{speechBubble}</div>
      )}
      {state.lifecycle === "alive" && state.creature?.name && size === "large" && (
        <div className="pixel-habitat-name">{state.creature.name}</div>
      )}
    </div>
  );
}
