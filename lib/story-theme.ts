export type StoryTheme = "green" | "pink" | "blue";

type StoryPalette = {
  background: string;
  text: string;
  muted: string;
  accent: string;
  card: string;
  line: string;
};

const palettes: Record<StoryTheme, StoryPalette> = {
  green: {
    background: "radial-gradient(circle at top right,#286842 0%,#10291b 38%,#07130e 100%)",
    text: "#f4fff5",
    muted: "#a8c5ae",
    accent: "#d9f6c5",
    card: "rgba(255,255,255,.07)",
    line: "rgba(255,255,255,.11)",
  },
  pink: {
    background: "radial-gradient(circle at top right,#eadcff 0%,#ffdbe9 38%,#fff6fa 100%)",
    text: "#4b2035",
    muted: "#90677c",
    accent: "#c7447c",
    card: "rgba(255,255,255,.66)",
    line: "rgba(199,68,124,.20)",
  },
  blue: {
    background: "radial-gradient(circle at top right,#ffffff 0%,#cceeff 38%,#eaf8ff 100%)",
    text: "#133a55",
    muted: "#60849c",
    accent: "#287eae",
    card: "rgba(255,255,255,.62)",
    line: "rgba(40,126,174,.20)",
  },
};

export function getStoryTheme(request: Request) {
  const value = new URL(request.url).searchParams.get("theme");
  const theme: StoryTheme = value === "pink" || value === "blue" ? value : "green";
  return palettes[theme];
}
