import { useState } from "react";
import "./SlugMood.css";

// Import all slug images
import amazed from "../assets/slugs/Amazed_Slug.png";
import impressed from "../assets/slugs/Impressed_Slug.png";
import worried from "../assets/slugs/Worried_Slug.png";
import judgemental from "../assets/slugs/Judgemental_Slug.png";
import existential from "../assets/slugs/Existential_Crisis_Slug.png";
import hungry from "../assets/slugs/Hungry_Slug.png";
import dying from "../assets/slugs/Dying_Slug.png";
import ghost from "../assets/slugs/Ghost_Slug.png";
import vacation from "../assets/slugs/Vecation_Slug.png";

export type SlugMoodType =
  | "amazed"
  | "impressed"
  | "happy"
  | "worried"
  | "judgemental"
  | "existential"
  | "hungry"
  | "dying"
  | "ghost"
  | "vacation"
  | "weekend";

const SLUG_IMAGES: Record<string, string> = {
  amazed,
  impressed,
  happy: impressed,
  worried,
  judgemental,
  existential,
  hungry,
  dying,
  ghost,
  vacation,
  weekend: vacation,
};

// ===== MESSAGES BY MOOD =====
const SLUG_MESSAGES: Record<SlugMoodType, string[]> = {
  amazed: [
    "Wait, you actually logged 8 hours?! The slug is speechless.",
    "Is this... a full day? The slug can't believe its eye.",
    "The slug needs a moment. This is beautiful.",
  ],
  impressed: [
    "The slug tips its hat to you, Captain.",
    "Now THAT'S a proper day's work. Well done.",
    "The slug nods approvingly. Carry on.",
  ],
  happy: [
    "Solid day. The slug approves.",
    "Not bad at all! The slug is content.",
    "A good honest day. The slug smiles.",
  ],
  worried: [
    "Hey... you forgot yesterday. It's fine. Probably.",
    "One day missed. The slug is keeping one eye open.",
    "The slug noticed. Just saying.",
  ],
  judgemental: [
    "Two days. The slug is watching.",
    "The slug is not angry. Just disappointed.",
    "The slug has seen more effort from a barnacle.",
  ],
  existential: [
    "Three days... Does the slug even matter to you?",
    "The slug questions the nature of productivity.",
    "The slug stares into the void. The void stares back.",
  ],
  hungry: [
    "The slug hasn't been fed in days. It's getting weak.",
    "0 TASKS. NO DATA. The slug is wasting away.",
    "Please... just one little log entry... the slug is begging.",
  ],
  dying: [
    "The slug can barely hold its cutlass anymore.",
    "The slug is drowning in unlogged work. Help.",
    "This is it. The slug sees the light. Log something. Please.",
  ],
  ghost: [
    "The slug has left its mortal form.",
    "10 working days. The slug is gone. You did this.",
    "If you're reading this, the slug didn't make it.",
    "The ghost of productivity past haunts this app.",
  ],
  vacation: [
    "The slug is on vacation. Don't even think about logging.",
    "Hammock mode activated. The slug will return.",
    "Even pirates need shore leave.",
  ],
  weekend: [
    "It's the weekend. Even slugs rest.",
    "The slug says: go outside.",
    "No logging on weekends. Captain's orders.",
  ],
};

// ===== MOOD FROM STREAK (working days missed) =====
export function getSlugMoodFromStreak(daysMissed: number, todayHours: number, isWeekend?: boolean): SlugMoodType {
  if (isWeekend) return "weekend";

  // If they logged today, mood is based on hours
  if (todayHours > 0 && daysMissed === 0) {
    if (todayHours >= 8) return "amazed";
    if (todayHours >= 6) return "impressed";
    return "happy";
  }

  // Streak of neglect (working days)
  if (daysMissed >= 10) return "ghost";
  if (daysMissed >= 6) return "dying";
  if (daysMissed >= 4) return "hungry";
  if (daysMissed >= 3) return "existential";
  if (daysMissed >= 2) return "judgemental";
  if (daysMissed >= 1) return "worried";

  return "happy";
}

// Legacy function for backward compat
export function getSlugMood(hours: number, isWeekend?: boolean, isVacation?: boolean): SlugMoodType {
  if (isVacation) return "vacation";
  if (isWeekend) return "weekend";
  if (hours >= 8) return "amazed";
  if (hours >= 6) return "impressed";
  if (hours >= 4) return "happy";
  if (hours >= 2) return "worried";
  if (hours > 0) return "judgemental";
  return "existential";
}

export function getSlugMessage(mood: SlugMoodType): string {
  const messages = SLUG_MESSAGES[mood];
  return messages[Math.floor(Math.random() * messages.length)];
}

// ===== COMPONENT =====
interface SlugMoodProps {
  mood: SlugMoodType;
  message?: string;
  size?: "small" | "medium" | "large";
  showMessage?: boolean;
}

export function SlugMood({ mood, message, size = "medium", showMessage = true }: SlugMoodProps) {
  const [displayMessage] = useState(() => message ?? getSlugMessage(mood));
  const src = SLUG_IMAGES[mood] ?? SLUG_IMAGES.happy;

  return (
    <div className={`slug-mood slug-mood-${size}`}>
      <div className="slug-mood-media">
        <img src={src} alt={mood} className="slug-mood-img" />
      </div>
      {showMessage && (
        <div className="slug-mood-message">{displayMessage}</div>
      )}
    </div>
  );
}
