import {adjectives, nouns} from '@/utils/wordList'
import random from 'random'
import seedrandom from 'seedrandom'

const getFakeUserByIp = (ip) => {
  random.use(seedrandom(ip))
  return random.choice(adjectives) + '-' + random.choice(nouns)
}

export default getFakeUserByIp