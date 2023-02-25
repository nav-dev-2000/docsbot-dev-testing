import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import { DocumentPlusIcon, PlusIcon } from '@heroicons/react/24/outline'
import Alert from '@/components/Alert'
import { getBase, getSources } from '@/lib/dbQueries'
import BaseCard from '@/components/BaseCard'
import ModalOpenAI from '@/components/ModalOpenAI'
import SourceForm from '@/components/SourceForm'
import SourceGrid from '@/components/SourceGrid'

function Base({ team, base, preSources }) {
  const [sources, setSources] = useState(preSources)
  const [errorText, setErrorText] = useState(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [canAddSource, setCanAddSource] = useState(true)
  const router = useRouter()
  const { baseId } = router.query

  return (
    <DashboardWrap page="Bases" title={base.name}>
      <Alert title={errorText} type="error" />

      <BaseCard base={base} />

      <SourceGrid {...{ sources }} />

      <SourceForm {...{ team, base, sources, setSources, setCanAddSource }} />

      <ModalOpenAI {...{ team }} />
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  const { baseId } = context.params

  if (data?.props?.team) {
    data.props.base = await getBase(data.props.team.id, baseId)
    //return 404 if base doesn't exist
    if (!data.props.base) {
      return {
        notFound: true,
      }
    }

    data.props.preSources = await getSources(data.props.team.id, data.props.base)
  }

  return data
}

export default Base
