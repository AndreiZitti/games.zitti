export const ICONIC_SUBJECTS = [
  {
    id: "homer",
    name: "Homer Simpson",
    targetLabel: "Homer's skin",
    image: "/games/chroma/iconic/homer.jpg",
    mask: "/games/chroma/iconic/homer-mask.png",
    width: 640,
    height: 480,
    targetHsb: [47, 85, 96],
    sourceUrl: "https://knowyourmeme.com/photos/2848610-homer-climbing-through-a-window",
  },
  {
    id: "shrek",
    name: "Shrek",
    targetLabel: "Shrek's skin",
    image: "/games/chroma/iconic/shrek.jpg",
    mask: "/games/chroma/iconic/shrek-mask.png",
    width: 1280,
    height: 720,
    targetHsb: [52, 72, 53],
    sourceUrl: "https://www.creativebloq.com/entertainment/movies-tv-shows/early-sketches-show-shrek-could-have-been-much-more-of-an-ogre",
  },
  {
    id: "spongebob",
    name: "SpongeBob SquarePants",
    targetLabel: "SpongeBob's body",
    image: "/games/chroma/iconic/spongebob.jpg",
    mask: "/games/chroma/iconic/spongebob-mask.png",
    width: 800,
    height: 533,
    targetHsb: [57, 67, 91],
    sourceUrl: "https://hypebae.com/2019/11/spongebob-squarepants-squidward-spin-off-nickelodeon-netflix",
  },
  {
    id: "pikachu",
    name: "Pikachu",
    targetLabel: "Pikachu's fur",
    image: "/games/chroma/iconic/pikachu.jpg",
    mask: "/games/chroma/iconic/pikachu-mask.png",
    width: 780,
    height: 438,
    targetHsb: [51, 68, 93],
    sourceUrl: "https://www.svg.com/1041353/the-stunning-transformation-of-pokemon/",
  },
];

export function shuffledIconicSubjects(random = Math.random) {
  const subjects = [...ICONIC_SUBJECTS];
  for (let index = subjects.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [subjects[index], subjects[swapIndex]] = [subjects[swapIndex], subjects[index]];
  }
  return subjects;
}
