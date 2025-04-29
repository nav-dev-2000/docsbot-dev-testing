import crypto from 'crypto'

export default function UserAvatar({ alias, email = null, ...props }) {
  let src = `https://api.dicebear.com/6.x/personas/svg?seed=${alias}?size=36&backgroundType=gradientLinear,solid&backgroundColor=FDE7E4,FFE8EF,FCF2FF,EBDFFF,EEF1FF,EAF5FF,E9FDFF,ECFFF6,F0FFE9,FFFDEE,FFF5DD,FFD9C9,EDEDED,FFFFFF,B3B3B3`

  if (email) {
    const emailLowercase = email.toLowerCase().trim()
    const gravatar = crypto.createHash('md5').update(emailLowercase).digest('hex')
    src = `https://www.gravatar.com/avatar/${gravatar}?s=36&d=mp`
  }
  return <img {...props} src={src} alt="User avatar" />
}
