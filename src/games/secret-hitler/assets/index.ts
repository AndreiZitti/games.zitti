// Static paths - all assets are in /public/secret-hitler/ and /public/player-portraits/
const portraits: Record<string, string> = {
  p_default: "/player-portraits/player-portrait-default.svg",
  p1: "/player-portraits/player-portrait-1.svg",
  p2: "/player-portraits/player-portrait-2.svg",
  p3: "/player-portraits/player-portrait-3.svg",
  p4: "/player-portraits/player-portrait-4.svg",
  p5: "/player-portraits/player-portrait-5.svg",
  p6: "/player-portraits/player-portrait-6.svg",
  p7: "/player-portraits/player-portrait-7.svg",
  p8: "/player-portraits/player-portrait-8.svg",
  p9: "/player-portraits/player-portrait-9.svg",
  p10: "/player-portraits/player-portrait-10.svg",
  p11: "/player-portraits/player-portrait-11.svg",
  p12: "/player-portraits/player-portrait-12.svg",
  p13: "/player-portraits/player-portrait-13.svg",
  p14: "/player-portraits/player-portrait-14.svg",
  p15: "/player-portraits/player-portrait-15.svg",
  p16: "/player-portraits/player-portrait-16.svg",
  p17: "/player-portraits/player-portrait-17.svg",
  p18: "/player-portraits/player-portrait-18.svg",
  p19: "/player-portraits/player-portrait-19.svg",
  p20: "/player-portraits/player-portrait-20.svg",
};
export default portraits;

export const defaultPortrait = "p_default";

export const unlockedPortraits: string[] = [
  "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10",
];
export const lockedPortraits: string[] = [
  "p11", "p12", "p13", "p14", "p15", "p16", "p17", "p18", "p19", "p20",
];

export const portraitsAltText: Record<string, string> = {
  p_default: "No icon selected.",
  p1: "A stranger in neat office attire with a dark tie.",
  p2: "A stranger with an elegant bun hiding behind a large fan.",
  p3: "A stranger with stylish white hair in a trendy sweater.",
  p4: "A stranger with light, curly hair in a dark overcoat.",
  p5: "A stranger with a bob and apron with large, hooped earrings.",
  p6: "A stranger with an afro, wearing a sweater and a vest.",
  p7: "A dark-haired stranger in a tidy blouse.",
  p8: "A stranger with thick spectacles wrapped in a scarf.",
  p9: "A stranger sporting a letterman's jacket and unkempt hair.",
  p10: "A stranger with parted hair wearing a pair of large headphones.",
  p11: "A stranger with a leather jacket and thick moustache.",
  p12: "A stranger with curly dark hair in a bright trench coat.",
  p13: "A stranger with reading glasses and a fancy sun hat.",
  p14: "A stranger peeking out from behind a newspaper.",
  p15: "A bald, bearded stranger in a neat cardigan.",
  p16: "A stranger with thick white hair in distinguished military garb.",
  p17: "A stranger who is not two toddlers stacked on top of each other.",
  p18: "A stranger with long bangs hiding half of their face.",
  p19: "A cat.",
  p20: "An unsettling stranger shadowed in darkness.",
};

export const badge = "/secret-hitler/badge.svg";
