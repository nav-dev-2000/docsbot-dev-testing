import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { useRouter } from 'next/router'
import clsx from 'clsx'
import docsbotLogo from '@/images/logos/docsbot-logo.svg'
import { NAVIGATION } from '@/constants/navigation.constants'
import { HeaderBanner } from '@/components/HeaderBanners'
import { NavItem } from '@ui/NavItem'
import HeaderAuthSection from '@/components/HeaderAuthSection'
import { Button } from './elements'

export default function Header({ transparent = false }) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined
    }

    const { body, documentElement } = document
    const previousBodyOverflow = body.style.overflow
    const previousHtmlOverflow = documentElement.style.overflow

    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previousBodyOverflow
      documentElement.style.overflow = previousHtmlOverflow
    }
  }, [mobileMenuOpen])

  return (
    <>
      <HeaderBanner />
      <header className="relative z-10">
        <div className={clsx('bg-gray-900 py-6', transparent && 'bg-transparent')}>
          <nav
            className="relative mx-auto flex max-w-7xl items-center justify-between gap-2 px-6"
            aria-label="Global"
          >
            <div className="flex flex-1 items-center">
              <div className="flex w-full items-center justify-between gap-2 md:w-auto">
                <Link href="/" className="flex-none">
                  <span className="sr-only">DocsBot</span>
                  <Image
                    className="max-h-8 h-auto w-auto shrink-0 sm:max-h-12 sm:max-w-48"
                    src={docsbotLogo}
                    alt="DocsBot Logo"
                  />
                </Link>
                <div className="flex items-center md:hidden">
                  <button
                    type="button"
                    className="focus-ring-inset inline-flex items-center justify-center rounded-md bg-gray-900 p-2 text-gray-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={() => setMobileMenuOpen(true)}
                  >
                    <span className="sr-only">Open main menu</span>
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="hidden space-x-4 md:ml-10 md:flex lg:space-x-8">
                {NAVIGATION.map((item) => {
                  const { children, ...itemProps } = item
                  const isBlogNav = itemProps.href === '/articles'
                  const active = isBlogNav
                    ? router.asPath === '/articles' || router.asPath.startsWith('/articles/')
                    : router.asPath === itemProps.href
                  return (
                    <NavItem
                      key={item.name}
                      href={itemProps.href}
                      name={itemProps.name}
                      active={active}
                      {...(children && { children })}
                    />
                  )
                })}
              </div>
            </div>
            <HeaderAuthSection />
          </nav>
        </div>

        <Transition.Root show={mobileMenuOpen} as={Fragment}>
          <Dialog as="div" className="relative z-modal md:hidden" onClose={setMobileMenuOpen}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 z-modal overflow-hidden">
              <div className="flex h-full items-stretch justify-end p-2">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="translate-y-2 scale-95 opacity-0"
                  enterTo="translate-y-0 scale-100 opacity-100"
                  leave="ease-in duration-150"
                  leaveFrom="translate-y-0 scale-100 opacity-100"
                  leaveTo="translate-y-2 scale-95 opacity-0"
                >
                  <Dialog.Panel className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5">
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                      <Link href="/" className="flex-none" onClick={() => setMobileMenuOpen(false)}>
                        <span className="sr-only">DocsBot</span>
                        <Image className="h-8 w-auto" src={docsbotLogo} alt="DocsBot Logo" />
                      </Link>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="sr-only">Close menu</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-5">
                      <div className="space-y-1">
                        {NAVIGATION.map((item) => (
                          <Fragment key={item.name}>
                            <Link
                              href={item.href}
                              className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {item.name}
                            </Link>
                            {item.children && item.children.map((subitem) => (
                              <Link
                                key={subitem.name}
                                href={subitem.href}
                                className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                → {subitem.name}
                              </Link>
                            ))}
                          </Fragment>
                        ))}
                      </div>

                      <Button
                        href="/register"
                        label="Try Free"
                        variant="primary"
                        theme="opalite"
                        className="block mt-6"
                        onClick={() => setMobileMenuOpen(false)}
                      />
                    </div>

                    <div className="border-t border-gray-200 bg-white px-5 py-5">
                      <p className="text-center text-sm font-medium text-gray-500">
                        Existing customer?{' '}
                        <Link
                          href="/login"
                          className="text-gray-900 hover:underline"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Login
                        </Link>
                      </p>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </header>
    </>
  )
}
