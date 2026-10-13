// Your favourite places. Copy an entry below to add another postcard.
// Front: photo, photoPosition (crop focal point), alt, title, caption.
// Back: note (your review), order (Don’t miss), address, country, stamp (a category).
// Photo paths start at public/: public/postcard-photos/lucie.jpg → /postcard-photos/lucie.jpg.
// Add photos to public/postcard-photos; restart npm run dev to generate responsive images.
// Leave photo empty for a paper placeholder.
// photoPosition uses horizontal / vertical percentages; 50% 50% centres the crop.
// Stamp icons: food = fork + spoon, nature = tree, tea = teacup, bar = cocktail, museum = museum.
// Entries appear in this order. The counter and navigation use the number of entries.

export const postcards = [
  {
    // Postcard 1 — front
    photo: "/postcard-photos/lucie.jpg",
    photoPosition: "53% 68%",
    alt: "Wellington with mashed potatoes at Lucie",
    title: "Lucie",
    caption: "warm and intimate",

    // Back — your review and order
    note:
      "Perfect for a romantic evening or a quiet dinner with friends. A glass of wine ties everything together.",
    order: "Bison Wellington!!",

    // Address lines — street address on the first line, country on the second
    address: "100 Yonge St, Toronto, ON M5C 2W1",
    country: "Canada",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "food",
  },

  {
    // Postcard 2 — front
    photo: "/postcard-photos/miss-fu.jpg",
    photoPosition: "50% 60%",
    alt: "Jelly noodles topped with chilli oil and herbs at Miss Fu",
    title: "Miss Fu in Chengdu",
    caption: "my go-to comfort food spot",

    // Back — your review and order
    note:
      "Signature Sichuan dishes and snacks. The perfect place to enjoy a casual meal with friends. Good value, too!",
    order: "Jelly noodles and bell dumplings",

    // Address lines — street address on the first line, country on the second
    address: "637 Yonge St, Toronto, ON M4Y 1Z5",
    country: "Canada",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "food",
  },

  {
    // Postcard 3 — front
    photo: "/postcard-photos/insectarium.jpg",
    photoPosition: "50% 57%",
    alt: "Magnifying lens among plants inside the Insectarium",
    title: "Insectarium de Montréal",
    caption: "whimsical and curious",

    // Back — your review and order
    note:
      "Super cool and fun and colourful and fascinating and awesome!!!",
    order: "Butterfly exhibits and ant farms",

    // Address lines — street address on the first line, country on the second
    address: "4581 R. Sherbrooke E, Montréal, QC H1X 2B2",
    country: "Canada",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "museum",
  },

  {
    // Postcard 4 — front
    photo: "/postcard-photos/wild-beach.jpg",
    photoPosition: "50% 65%",
    alt: "Deer among trees and tall grasses at Wild beach",
    title: "Wild beach",
    caption: "the spot",

    // Back — your review and order
    note: "Critters galore! A quaint trail with friendly chickadees and a local herd of deer. Good for bird-watching and bird-feeding. The road trails off onto the shore by the lake, with a marsh on the other side. Full of life in every season.",
    order: "chickadees eager to land on you and check for seeds",

    // Address lines — street address on the first line, country on the second
    address: "lowkey gatekeeping... you'll have to ask",
    country: "Canada",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "nature",
  },

  {
    // Postcard 5 — front
    photo: "/postcard-photos/ngogo.jpg",
    photoPosition: "42% 58%",
    alt: "Sliced duck with grains and sauce at NGOGO",
    title: "NGOGO",
    caption: "RIP",

    // Back — your review and order
    note: "Sadly, it’s closed now, but it was one of my favourite restaurants in the city and truly underrated. It was unbelievably good value ($38 for a four-course tasting menu!!), and the food and service were also exceptional.",
    order: "Duck breast main",

    // Address lines — street address on the first line, country on the second
    address: "646 Queen St W, Toronto, ON M6J 1E4",
    country: "Canada",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "food",
  },

  {
    // Postcard 6 — front
    photo: "/postcard-photos/luhong.jpg",
    photoPosition: "50% 66%",
    alt: "Plants and a koi pond inside Luhong Art Museum",
    title: "Luhong Art Museum",
    caption: "carefully curated",

    // Back — your review and order
    note: "A thoughtfully designed museum with a beautiful garden. Peaceful and serene. The chocolate shop inside is also worth a visit.",
    order: "Koi pond and black swans!",

    // Address lines — street address on the first line, country on the second
    address: "Shunyi District, Beijing, 101312",
    country: "China",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "museum",
  },

  {
    // Postcard 7 — front
    photo: "/postcard-photos/chen-mapo.jpg",
    photoPosition: "85% 68%",
    alt: "Sichuan dishes shared around a table at Chen Mapo",
    title: "Chen Mapo",
    caption: "a must-try in Chengdu",

    // Back — your review and order
    note: "The Zhong dumplings here are one of the yummiest things I've ever tasted in my whole life. I was licking the sauce off my chopsticks!",
    order: "Zhong dumplings",

    // Address lines — street address on the first line, country on the second
    address: "10 Qinghua Rd, 青羊宫商圈 Qingyang District, Chengdu, Sichuan, 610032",
    country: "China",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "food",
  },

  {
    // Postcard 8 — front
    photo: "/postcard-photos/sora45.jpg",
    photoPosition: "50% 58%",
    alt: "Bao and small dishes beside the city view at Sora 45",
    title: "Sora 45",
    caption: "drinks with a great view",

    // Back — your review and order
    note: "Cocktails, snacks, and a view of the city from the 45th floor. Enjoying the sunset with friends was a wonderful experience.",
    order: "Beef & oyster tartare",

    // Address lines — street address on the first line, country on the second
    address: "1 Pl. Ville-Marie, Montréal, QC H3B 4E8",
    country: "Canada",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "bar",
  },

  {
    // Postcard 9 — front
    photo: "/postcard-photos/glyptothek.jpg",
    photoPosition: "55% 50%",
    alt: "Classical columns and sculpture on the Glyptothek exterior",
    title: "Glyptothek",
    caption: "in awe",

    // Back — your review and order
    note: "Super cool and intricate classical sculptures. I also really like the design and layout of the building as a whole.",
    order: "all of it",

    // Address lines — street address on the first line, country on the second
    address: "Königsplatz 3, 80333 München-Maxvorstadt",
    country: "Germany",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "museum",
  },

  {
    // Postcard 10 — front
    photo: "/postcard-photos/sauriol.jpg",
    photoPosition: "50% 58%",
    alt: "Wooded valley and river viewed from Charles Sauriol Conservation Area",
    title: "Charles Sauriol Conservation Area",
    caption: "lots to explore",

    // Back — your review and order
    note: "A huge area with lots of trails and a beautiful view of the Don Valley. A great place to go for a walk and to enjoy nature in the city. In the woods, there are also remnants of a DIY obstacle course or playground of some sort.",
    order: "Sauriol cliff",

    // Address lines — street address on the first line, country on the second
    address: "1191 Lawrence Ave E, North York, ON M3A 3P9",
    country: "Canada",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "nature",
  },

  {
    // Postcard 11 — front
    photo: "/postcard-photos/prequel.jpg",
    photoPosition: "50% 15%",
    alt: "Cocktails and tartare on toast at Prequel",
    title: "PREQUEL & CO. APOTHECARY",
    caption: "smells amazing",

    // Back — your review and order
    note: "Apothecary-themed speakeasy with a great selection of herbal and floral cocktails.",
    order: "Steak tartare and French 75",

    // Address lines — street address on the first line, country on the second
    address: "1036 Queen St W, Toronto, ON M6J 1H7",
    country: "Canada",

    // Stamp: "food", "nature", "tea", "bar", or "museum"
    stamp: "bar",
  },
] as const;
