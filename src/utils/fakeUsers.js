const getFakeUserByIp = (ip) => {
  const wordList = [ // this wordlist was generated via GPT prompt "give me a javascript-formatted array of 100 random nouns, names and words"
    "penguin",
    "cupcake",
    "basketball",
    "watermelon",
    "avocado",
    "octopus",
    "butterfly",
    "shark",
    "computer",
    "sunset",
    "hamburger",
    "guitar",
    "chocolate",
    "coffee",
    "sailboat",
    "helicopter",
    "piano",
    "dragon",
    "giraffe",
    "cactus",
    "pineapple",
    "rainbow",
    "skyscraper",
    "bicycle",
    "taco",
    "hotdog",
    "icecream",
    "popcorn",
    "snorkel",
    "chimpanzee",
    "lemur",
    "squirrel",
    "elephant",
    "lighthouse",
    "unicorn",
    "rhinoceros",
    "scissors",
    "camera",
    "violin",
    "trampoline",
    "kangaroo",
    "zebra",
    "koala",
    "dolphin",
    "whale",
    "seagull",
    "butter",
    "cheese",
    "bread",
    "soup",
    "salad",
    "pizza",
    "lasagna",
    "spaghetti",
    "sandwich",
    "frenchfries",
    "pancake",
    "waffle",
    "bagel",
    "croissant",
    "muffin",
    "cookie",
    "brownie",
    "donut",
    "scone",
    "banana",
    "apple",
    "orange",
    "lemon",
    "strawberry",
    "blueberry",
    "peach",
    "grape",
    "water",
    "juice",
    "soda",
    "milk",
    "beer",
    "wine",
    "whiskey",
    "rum",
    "tequila",
    "vodka",
    "gin",
    "martini",
    "margarita",
    "mojito",
    "cosmopolitan",
    "manhattan",
    "oldfashioned",
    "negroni",
    "sazerac",
    "bee",
    "ant",
    "worm",
    "snail",
    "ladybug",
    "spider",
    "fly",
    "mosquito",
    "grasshopper",
    "beekeeper",
    "gardener",
    "chef",
    "scientist",
    "musician",
    "writer",
    "teacher",
    "doctor",
    "lawyer",
    "athlete",
    "artist",
    "dancer",
    "actor",
    "politician",
  ]

  const seeder = (s) => { // generate pseudo-random numbers based off a unique string
    let seed = 0
    for (let i = 0; i < s.length; i++) {
      const chr = s.charAt(i)
      seed = ((seed << 5) - seed) + chr;
      seed |= 0
    }

    return () => {
      seed = Math.sin(seed) * 10000; return seed - Math.floor(seed);
    }
  }

  let name = ""
  const generator = seeder(ip)
  for (let i = 0; i < 3; i++) {
    name = name + wordList[Math.floor(generator() * wordList.length)]
    if (i != 2) {
      name = name + '-'
    }
  }

  return name
}

export default getFakeUserByIp