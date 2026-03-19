import { useEffect, useCallback } from 'react'
import { noop } from '@/utils/function.utils'
import { postAuth } from '@/api/postAuth'
import { getIsNewGmailUser } from '@/utils/firebase.utils'

export function useRegisterGoogleUser({
  googleUser,
  authLoading,
  setAuthLoading,
  userType = null,
  domain = null,
  onComplete = noop,
}) {
  const authorizeUser = useCallback(postAuth, [])
  useEffect(() => {
    if (googleUser && !authLoading) {
      setAuthLoading(true)
      const isNewUser = getIsNewGmailUser(googleUser)
      authorizeUser({
        accessToken: googleUser?.user?.accessToken,
        name: googleUser?.user?.displayName,
        isNewUser,
        userType: userType ?? null,
        domain: userType === 'business' && domain?.trim() ? domain.trim() : null,
        email: googleUser?.user?.email ?? null,
        onComplete: () => {
          onComplete()
        },
      })
    }
  }, [googleUser, authLoading, authorizeUser, onComplete, userType, domain])
}
