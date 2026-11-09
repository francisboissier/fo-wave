const coverFiles = [
  { file: "FO—WAVE ISSUE ONE COVER 1.jpg", title: "Armani Selfies", author: "Francis Boissier" },
  { file: "FO—WAVE ISSUE ONE COVER 2.jpg", title: "I’m Running", author: "Ned Sims" },
  { file: "FO—WAVE ISSUE ONE COVER 3.jpg", title: "Decoy", author: "Lottie Collins" },
  { file: "FO—WAVE ISSUE ONE COVER 4.jpg", title: "Crufts 2026", author: "Luc Fellner" },
  { file: "FO—WAVE ISSUE ONE COVER 5.jpg", title: "Mehdi", author: "Michael Hauptman" },
  { file: "FO—WAVE ISSUE ONE COVER 6.jpeg", title: "Myron", author: "Vadym Ivchenko" },
];

export const covers = coverFiles.map(({ file, title, author }) => ({
  src: encodeURI(`/COVERS/${file}`),
  caption: `${title} by ${author}`,
  alt: `FO—WAVE Issue One cover: ${title} by ${author}`,
}));
