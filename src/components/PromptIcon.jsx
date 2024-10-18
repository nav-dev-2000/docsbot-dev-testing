import { DocumentTextIcon } from '@heroicons/react/24/outline'
import * as Icons from '@heroicons/react/24/outline'

const PromptIcon = ({ icon, className }) => {
  const IconComponent = Icons[icon] || DocumentTextIcon

  return <IconComponent className={className} />
}

export default PromptIcon
