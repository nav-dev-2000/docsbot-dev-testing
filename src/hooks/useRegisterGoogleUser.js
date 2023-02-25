import { useEffect, useCallback } from 'react'
import { noop } from '@/utils/function.utils'
import { postAuth } from '@/api/postAuth'
import { getIsNewGmailUser } from '@/utils/firebase.utils'

export function useRegisterGoogleUser({ googleUser, googleAuthLoading, onComplete = noop }) {
  const authorizeUser = useCallback(postAuth, [])
  useEffect(() => {
    if (googleUser && !googleAuthLoading) {
      const isNewUser = getIsNewGmailUser(googleUser)
      authorizeUser({
        accessToken: googleUser?.user?.accessToken,
        name: googleUser?.user?.displayName,
        isNewUser,
        onComplete: () => {
          onComplete()
        },
      })
    }
  }, [googleUser, googleAuthLoading, authorizeUser, onComplete])
}
