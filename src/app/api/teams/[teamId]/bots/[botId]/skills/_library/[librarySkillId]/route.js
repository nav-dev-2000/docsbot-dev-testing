import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { isSuperAdmin } from '@/utils/helpers'
import { deleteLibrarySkill } from '@/lib/skills-builder'

export const dynamic = 'force-dynamic'

export async function DELETE(request, context) {
  try {
    const params = await context.params
    const { userId, firestore } = await getAuthorizedBotContext(request, params)

    if (!isSuperAdmin(userId)) {
      return jsonError('Only super admins can delete skills from the library.', 403)
    }

    const result = await deleteLibrarySkill(params.librarySkillId, firestore)
    if (!result.deleted) {
      return jsonError('Library skill not found.', 404)
    }

    return NextResponse.json({
      ok: true,
      r2Deleted: result.r2Deleted,
      r2Cleaned: result.r2Cleaned,
    })
  } catch (error) {
    return jsonError(error?.message || 'Unable to delete library skill.', error?.status || 500)
  }
}
