import wordList from '@/utils/wordList'

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

  let name = ""
  const generator = seeder(ip)
  for (let i = 0; i < 2; i++) {
    name = name + wordList[Math.floor(generator() * wordList.length)]
    if (i != 1) {
      name = name + '-'
    }
  }

  return name
}

export default getFakeUserByIp