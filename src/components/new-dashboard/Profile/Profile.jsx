import { Fragment, useCallback } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useRouter } from 'next/router'
import { useAuthState } from 'react-firebase-hooks/auth'
import { signOut } from 'firebase/auth'
import { usePostHog } from 'posthog-js/react'
import { auth } from '@/config/firebase-ui.config'
import { logout } from '@/api/logout'
import { routePaths } from '@/constants/routePaths.constants'
import ProfileButton from './ProfileButton'
import ProfileMenu from './ProfileMenu'

const Profile = () => {
    const router = useRouter()
    const [user] = useAuthState(auth)
    const posthog = usePostHog()
    const logoutUser = useCallback(logout, [])

    const signUserOut = () => {
        signOut(auth).then(() => {
            logoutUser({
                onComplete: () => {
                    posthog?.reset()
                    router.push(routePaths.LOGIN)
                },
            })
        })
    }

    const userNavigation = [{ name: 'Account', href: '/app/account' }]

    return (
        <Menu as="div" className="relative" data-component="profile">
            <ProfileButton user={user} />
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <ProfileMenu
                    user={user}
                    userNavigation={userNavigation}
                    signUserOut={signUserOut}
                />
            </Transition>
        </Menu>
    )
}

export default Profile
