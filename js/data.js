export const CATEGORIES = [
  "All tools",
  "Power tools",
  "Home & repair",
  "Creative",
  "Electronics",
  "Garden",
  "Mobility",
];

export const TOOL_ART = {
  drill: {
    label: "Cordless drill illustration",
    viewBox: "0 0 240 170",
    markup: `
      <path d="M56 58h104c13 0 24 11 24 24v20H94c-21 0-38-17-38-38v-6Z" fill="#ff7b54"/>
      <path d="M102 102h42l-10 49H96l6-49Z" fill="#163d36"/>
      <path d="M154 66h42v27h-42z" fill="#f5c453"/>
      <path d="M196 72h24v14h-24z" fill="#163d36"/>
      <circle cx="83" cy="80" r="13" fill="#fff8ec"/><circle cx="83" cy="80" r="6" fill="#163d36"/>
      <path d="M112 116h20" stroke="#f5c453" stroke-width="8" stroke-linecap="round"/>
    `,
  },
  ladder: {
    label: "Extension ladder illustration",
    viewBox: "0 0 240 170",
    markup: `
      <path d="m69 153 34-136M171 153 137 17" stroke="#163d36" stroke-width="13" stroke-linecap="round"/>
      <path d="M91 49h58M84 77h72M77 105h86M70 133h100" stroke="#ff7b54" stroke-width="9" stroke-linecap="round"/>
      <circle cx="195" cy="39" r="20" fill="#f5c453" opacity=".9"/>
    `,
  },
  sewing: {
    label: "Sewing machine illustration",
    viewBox: "0 0 240 170",
    markup: `
      <path d="M53 46h91c28 0 51 23 51 51v28h-67V92H94v33H53V46Z" fill="#9a7bd5"/>
      <path d="M39 125h168v22H39z" fill="#163d36"/>
      <circle cx="165" cy="73" r="19" fill="#fff8ec"/><circle cx="165" cy="73" r="8" fill="#f5c453"/>
      <path d="M104 91v35" stroke="#163d36" stroke-width="5"/><path d="M98 125h21" stroke="#ff7b54" stroke-width="5"/>
    `,
  },
  projector: {
    label: "Mini projector illustration",
    viewBox: "0 0 240 170",
    markup: `
      <rect x="46" y="47" width="149" height="87" rx="23" fill="#2e7064"/>
      <circle cx="150" cy="90" r="31" fill="#fff8ec"/><circle cx="150" cy="90" r="19" fill="#8dd3c7"/>
      <circle cx="73" cy="70" r="6" fill="#f5c453"/><path d="M68 134v13M177 134v13" stroke="#163d36" stroke-width="8" stroke-linecap="round"/>
      <path d="M203 57 232 38v103l-29-19Z" fill="#f5c453" opacity=".48"/>
    `,
  },
  toolkit: {
    label: "Hand-tool kit illustration",
    viewBox: "0 0 240 170",
    markup: `
      <rect x="35" y="63" width="170" height="84" rx="18" fill="#f5c453"/>
      <path d="M83 63V46c0-12 10-22 22-22h30c12 0 22 10 22 22v17" fill="none" stroke="#163d36" stroke-width="12"/>
      <path d="M35 93h170" stroke="#163d36" stroke-width="8"/><rect x="105" y="83" width="30" height="22" rx="6" fill="#ff7b54"/>
      <path d="m67 111 22 22M89 111l-22 22" stroke="#163d36" stroke-width="7" stroke-linecap="round"/>
    `,
  },
  garden: {
    label: "Garden tools illustration",
    viewBox: "0 0 240 170",
    markup: `
      <path d="M97 148 75 33M145 148l27-115" stroke="#8d5a3b" stroke-width="9" stroke-linecap="round"/>
      <path d="M58 30h34l-5 35c-2 14-22 14-24 0l-5-35Z" fill="#ff7b54"/>
      <path d="M156 29h33l-8 34h-17l-8-34Z" fill="#f5c453"/>
      <path d="M46 148c12-36 38-42 65-19 20-30 58-30 82 19H46Z" fill="#2e7064"/>
      <path d="M120 110c-4-27 11-45 35-50-1 24-10 43-35 50Z" fill="#8dd3c7"/>
    `,
  },
  washer: {
    label: "Pressure washer illustration",
    viewBox: "0 0 240 170",
    markup: `
      <rect x="60" y="42" width="96" height="92" rx="22" fill="#4d78c9"/>
      <circle cx="83" cy="137" r="16" fill="#163d36"/><circle cx="143" cy="137" r="16" fill="#163d36"/>
      <path d="M97 42V24h72v19" fill="none" stroke="#163d36" stroke-width="10" stroke-linecap="round"/>
      <circle cx="108" cy="82" r="21" fill="#fff8ec"/><path d="M156 70c32 0 38 25 19 39-13 10-4 28 15 19" fill="none" stroke="#ff7b54" stroke-width="8" stroke-linecap="round"/>
    `,
  },
  bike: {
    label: "Bicycle repair stand illustration",
    viewBox: "0 0 240 170",
    markup: `
      <circle cx="73" cy="117" r="34" fill="none" stroke="#163d36" stroke-width="8"/>
      <circle cx="173" cy="117" r="34" fill="none" stroke="#163d36" stroke-width="8"/>
      <path d="m73 117 39-57 34 57H73Zm39-57 38 3 23 54M100 78h-23" fill="none" stroke="#ff7b54" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M120 28v112M94 140h52" stroke="#2e7064" stroke-width="8" stroke-linecap="round"/>
    `,
  },
};

export const SEED_TOOLS = [
  {
    id: "tool-drill",
    name: "18V cordless drill",
    category: "Power tools",
    description: "Compact drill with two batteries, charger, and a 30-piece bit set. Great for shelves, furniture, and light masonry.",
    owner: "Meena S.",
    neighborhood: "Anna Nagar",
    distanceKm: 1.2,
    pricePerDay: 60,
    deposit: 500,
    rating: 4.9,
    reviews: 37,
    condition: "Excellent",
    available: true,
    featured: true,
    art: "drill",
    tags: ["battery", "wood", "masonry"],
    rules: "Return fully charged. Safety glasses included.",
    bookedRanges: [],
  },
  {
    id: "tool-ladder",
    name: "12-foot extension ladder",
    category: "Home & repair",
    description: "Lightweight aluminium ladder with anti-slip feet. Folds down for easy transport.",
    owner: "Arun K.",
    neighborhood: "Mogappair",
    distanceKm: 2.8,
    pricePerDay: 90,
    deposit: 800,
    rating: 4.8,
    reviews: 22,
    condition: "Very good",
    available: true,
    featured: false,
    art: "ladder",
    tags: ["painting", "roof", "cleaning"],
    rules: "Two-person pickup recommended.",
    bookedRanges: [],
  },
  {
    id: "tool-sewing",
    name: "Portable sewing machine",
    category: "Creative",
    description: "Beginner-friendly machine with 12 stitches, foot pedal, spare bobbins, and a quick-start card.",
    owner: "Fathima R.",
    neighborhood: "Kilpauk",
    distanceKm: 3.4,
    pricePerDay: 80,
    deposit: 700,
    rating: 5,
    reviews: 18,
    condition: "Excellent",
    available: true,
    featured: true,
    art: "sewing",
    tags: ["fabric", "craft", "repair"],
    rules: "Use standard cotton thread only.",
    bookedRanges: [],
  },
  {
    id: "tool-projector",
    name: "1080p mini projector",
    category: "Electronics",
    description: "Portable projector with HDMI cable, remote, tripod, and a compact 60-inch screen.",
    owner: "Joseph D.",
    neighborhood: "Nungambakkam",
    distanceKm: 4.1,
    pricePerDay: 150,
    deposit: 1200,
    rating: 4.7,
    reviews: 31,
    condition: "Very good",
    available: true,
    featured: false,
    art: "projector",
    tags: ["movie", "presentation", "HDMI"],
    rules: "Indoor use only. Return in padded case.",
    bookedRanges: [],
  },
  {
    id: "tool-toolkit",
    name: "108-piece repair toolkit",
    category: "Home & repair",
    description: "All-purpose toolkit with screwdrivers, sockets, pliers, hex keys, tape measure, and hammer.",
    owner: "Vijay P.",
    neighborhood: "Arumbakkam",
    distanceKm: 2.1,
    pricePerDay: 45,
    deposit: 400,
    rating: 4.9,
    reviews: 44,
    condition: "Excellent",
    available: true,
    featured: true,
    art: "toolkit",
    tags: ["repair", "assembly", "mechanic"],
    rules: "Checklist all pieces before return.",
    bookedRanges: [],
  },
  {
    id: "tool-garden",
    name: "Weekend garden set",
    category: "Garden",
    description: "Spade, fork, pruning shears, hand rake, gloves, and watering nozzle in one carry bag.",
    owner: "Lakshmi V.",
    neighborhood: "Shenoy Nagar",
    distanceKm: 1.8,
    pricePerDay: 50,
    deposit: 350,
    rating: 4.8,
    reviews: 27,
    condition: "Very good",
    available: true,
    featured: false,
    art: "garden",
    tags: ["plants", "pruning", "soil"],
    rules: "Clean soil from tools before return.",
    bookedRanges: [],
  },
  {
    id: "tool-washer",
    name: "Compact pressure washer",
    category: "Power tools",
    description: "1400W washer with patio head, foam bottle, and 5-metre hose for cars, balconies, and paving.",
    owner: "Rahul M.",
    neighborhood: "Chetpet",
    distanceKm: 5.6,
    pricePerDay: 120,
    deposit: 1000,
    rating: 4.6,
    reviews: 16,
    condition: "Good",
    available: false,
    featured: false,
    art: "washer",
    tags: ["car", "patio", "cleaning"],
    rules: "Standard tap connector supplied.",
    bookedRanges: [],
  },
  {
    id: "tool-bike",
    name: "Bicycle repair stand",
    category: "Mobility",
    description: "Stable adjustable stand with rotating clamp, magnetic parts tray, and basic cycle tools.",
    owner: "Naveen T.",
    neighborhood: "Aminjikarai",
    distanceKm: 3.7,
    pricePerDay: 70,
    deposit: 600,
    rating: 4.9,
    reviews: 13,
    condition: "Excellent",
    available: true,
    featured: false,
    art: "bike",
    tags: ["cycle", "maintenance", "repair"],
    rules: "Clamp frame only at approved points.",
    bookedRanges: [],
  },
];
