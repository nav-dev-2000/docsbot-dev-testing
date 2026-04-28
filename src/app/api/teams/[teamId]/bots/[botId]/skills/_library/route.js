import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { listLibrarySkills, searchLibrarySkills } from '@/lib/skills-builder'

export const dynamic = 'force-dynamic'

export async function GET(request, context) {
  try {
    const params = await context.params
    const { firestore } = await getAuthorizedBotContext(request, params)
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || url.searchParams.get('q') || ''
    const limit = Number(url.searchParams.get('limit') || 20)

    if (query.trim()) {
      const search = await searchLibrarySkills(query, firestore, { limit })
      return NextResponse.json({
        skills: search.skills,
        search: {
          configured: search.configured,
          message: search.message,
        },
      })
    }

    const skills = await listLibrarySkills(firestore)

    return NextResponse.json({ skills })
  } catch (error) {
    return jsonError(error?.message || 'Unable to load skills library.', error?.status || 500)
  }
}

export async function HEAD(request, context) {
  try {
    const params = await context.params
    await getAuthorizedBotContext(request, params)
    return new Response(null, { status: 204 })
  } catch (error) {
    return new Response(null, { status: error?.status || 500 })
  }
}
