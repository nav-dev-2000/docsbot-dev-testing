import {adjectives, nouns} from '@/utils/wordList'

const getFakeUserByIp = (ip) => {
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

  const generator = seeder(ip)
  return adjectives[Math.floor(generator() * adjectives.length)] + '-' + nouns[Math.floor(generator() * nouns.length)]
}

export default getFakeUserByIp