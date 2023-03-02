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

function Base({ team, preBase, preSources }) {
  const [sources, setSources] = useState(preSources)
  const [base, setBase] = useState(preBase)
  const [errorText, setErrorText] = useState(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [canAddSource, setCanAddSource] = useState(true)
  const router = useRouter()
  const { baseId } = router.query

  async function refreshBase() {

    const urlParams = ['teams', team.id, 'bases', baseId]
    let path = '/api/' + urlParams.join('/')
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      setBase(data)
      setErrorText('')
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText(response.statusText + ', please try again.')
      }
    }
  }

  async function refreshSources() {

    const urlParams = ['teams', team.id, 'bases', baseId, 'sources']
    let path = '/api/' + urlParams.join('/')
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      setSources(data)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText(response.statusText + ', please try again.')
      }
    }
  }

  //restart polling when sources change
  useEffect(() => {
    let interval = null
    if (base) {
      if (isProcessing && !interval) {
        clearInterval(interval)
        interval = setInterval(() => {
          refreshBase()
          refreshSources()
        }, 10000)
      }
      if (!isProcessing && interval) {
        clearInterval(interval)
      }
    }

    return () => clearInterval(interval)
  }, [isProcessing])

  useEffect(() => {
    //set processing if there are any sources with status 'indexing'
    if (sources.some((source) => ['pending', 'indexing'].includes(source.status))) {
      setIsProcessing(true)
    } else {
      setIsProcessing(false)
    }
    
  }, [sources])

  if (!base) return null

  return (
    <DashboardWrap page="Bases" title={base.name}>
      <Alert title={errorText} type="error" />

      <BaseCard team={team} base={base} />

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
    data.props.preBase = await getBase(data.props.team.id, baseId)
    //return 404 if base doesn't exist
    if (!data.props.preBase) {
      return {
        notFound: true,
      }
    }

    data.props.preSources = await getSources(data.props.team.id, data.props.preBase)
  }

  return data
}

export default Base
