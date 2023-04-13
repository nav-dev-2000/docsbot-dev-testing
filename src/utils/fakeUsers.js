import {adjectives, nouns} from '@/utils/wordList'

const getFakeUserByIp = (ip) => {
  const seeder = (s) => { // generate pseudo-random numbers based off a unique string
    let seed = 0
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for(let i = 0, ch; i < s.length; i++) {
        ch = s.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    seed = 4294967296 * (2097151 & h2) + (h1 >>> 0);

    return () => {
      seed = (2364617249 * seed + 1261244998)
      return Math.sin(seed)
    }
  }

  const generator = seeder(ip)
  return adjectives[Math.floor(generator() * adjectives.length)] + '-' + nouns[Math.floor(generator() * nouns.length)]
}

export default getFakeUserByIp