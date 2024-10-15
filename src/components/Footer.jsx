import Link from 'next/link'
import Image from 'next/image'
import docsbotLogo from '@/images/docsbot-logo.png'
import { NAVIGATION } from '@/constants/navigation.constants'
import { ALTERNATIVES } from '@/constants/alternatives.constants'
import { INDUSTRIES } from '@/constants/industries.constants'
import { freeTools } from '@/constants/freeTools.constants'

const comparisons = ALTERNATIVES.map((item) => ({
  name: `${item.name} Alternative`,
  href: `/comparisons/${item.slug}-alternative`,
}))

const industries = Object.entries(INDUSTRIES.reduce((acc, item) => {
  acc[item.industry] = [...(acc[item.industry] || []), item];
  return acc;
}, {})).map(([industry, items], industryIndex) => (
  {
    name: `${industry}`,
    href: `/industry/${items[0].slug}`,
  }))

const footerNavigation = {
  pages: NAVIGATION,
  tools: [
    { name: 'Imajinn AI', href: 'https://imajinn.ai' },
    { name: 'Infinite Uploads', href: 'https://infiniteuploads.com' },
  ],
  comparisons: comparisons.slice(0, 8),
  tools2: [
    ...Object.entries(freeTools.reduce((acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      if (acc[tool.category].length < 2) {
        acc[tool.category].push(tool);
      }
      return acc;
    }, {})).flatMap(([_, tools]) => tools).map(tool => ({
      name: tool.name,
      href: tool.href,
    })),
    { name: 'All Free Tools →', href: '/tools' },
  ],
  industries,
  legal: [
    { name: 'Legal', href: '/legal' },
    { name: 'Press', href: '/press' },
    { name: 'Affiliate Program', href: '/affiliates' },
  ],
  social: [
    {
      name: 'X/Twitter',
      href: 'https://twitter.com/UglyRobotDev/',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/docsbot-ai',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 20" {...props}>
          <path d="M17.0391667,17.0433333 L14.0775,17.0433333 L14.0775,12.4025 C14.0775,11.2958333 14.055,9.87166667 12.5341667,9.87166667 C10.99,9.87166667 10.7541667,11.0758333 10.7541667,12.3208333 L10.7541667,17.0433333 L7.7925,17.0433333 L7.7925,7.5 L10.6375,7.5 L10.6375,8.80083333 L10.6758333,8.80083333 C11.0733333,8.05083333 12.04,7.25916667 13.4841667,7.25916667 C16.485,7.25916667 17.04,9.23416667 17.04,11.805 L17.04,17.0433333 L17.0391667,17.0433333 Z M4.4475,6.19416667 C3.49416667,6.19416667 2.72833333,5.4225 2.72833333,4.47333333 C2.72833333,3.525 3.495,2.75416667 4.4475,2.75416667 C5.3975,2.75416667 6.1675,3.525 6.1675,4.47333333 C6.1675,5.4225 5.39666667,6.19416667 4.4475,6.19416667 Z M5.9325,17.0433333 L2.9625,17.0433333 L2.9625,7.5 L5.9325,7.5 L5.9325,17.0433333 Z M18.5208333,0 L1.47583333,0 C0.66,0 0,0.645 0,1.44083333 L0,18.5591667 C0,19.3558333 0.66,20 1.47583333,20 L18.5183333,20 C19.3333333,20 20,19.3558333 20,18.5591667 L20,1.44083333 C20,0.645 19.3333333,0 18.5183333,0 L18.5208333,0 Z"/>
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: 'https://github.com/uglyrobot/',
      icon: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    }
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-50" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-md px-6 pt-12 sm:max-w-7xl lg:px-8 lg:pt-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 text-left xl:col-span-1">
            <Image className="mr-auto h-10 w-auto" src={docsbotLogo} alt="DocsBot Logo" />
            <p className="text-base text-gray-500">
              An <Link href="https://uglyrobot.dev">UglyRobot</Link> thing.
            </p>
            <div className="flex space-x-6">
              {footerNavigation.social.map((item) => (
                <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
            <iframe
              src="https://docsbot.instatus.com/embed-status/e21b573c/light-md"
              width="240"
              height="61"
              frameBorder="0"
              scrolling="no"
              className="border-none"
            ></iframe>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-base font-medium text-gray-900">Pages</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.pages.map((item) => (
                    <li key={item.name} className="leading-tight">
                      <a href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-6 text-base font-medium text-gray-900">Meta</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.legal.map((item) => (
                    <li key={item.name} className="leading-tight">
                      <a href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-base font-medium text-gray-900">Free AI Tools</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.tools2.map((item) => (
                    <li key={item.name} className="leading-tight">
                      <a href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
            <div className="mt-12 md:mt-0">
                <h3 className="text-base font-medium text-gray-900">Other Products</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.tools.map((item) => (
                    <li key={item.name} className="leading-tight">
                      <a href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-6 text-base font-medium text-gray-900">Comparisons</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.comparisons.map((item) => (
                    <li key={item.name} className="leading-tight">
                      <a href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-12 md:mt-0">
                <h3 className="text-base font-medium text-gray-900">For Industries</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerNavigation.industries.map((item) => (
                    <li key={item.name} className="leading-tight">
                      <a href={item.href} className="text-base text-gray-500 hover:text-gray-900">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 py-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; 2024 UglyRobot, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
