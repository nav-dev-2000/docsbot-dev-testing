import Head from 'next/head'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import ContentSection from '@/components/ContentSection'

export default function Home() {
  return (
    <>
      <Head>
        <title key="title">Imajinn AI - Privacy Policy</title>
        <meta name="description" content="Privacy Policy for Imajinn AI" key="description" />
      </Head>
      <Header />
      <main>
        <ContentSection
          pretitle="Imajinn AI"
          title="Privacy Policy"
          intro="The privacy of your data is important to us, and we work hard to maintain it with careful design decisions and sparing use of third-party services that we trust."
        >
          <h2>Who We Are</h2>
          <p>UglyRobase, LLC provides AI services Imajinn AI.</p>
          <p>
            This privacy policy applies to all visitors and customers using or accessing any of the
            websites that we produced and maintain for the services that we provide, including
            imajinn.ai. It also applies to human resources data of our employees and contractors.
          </p>
          <p>
            This policy DOES NOT cover generated content we host for our customers that is shared by
            them. In that case the customer is responsible for publishing its own privacy policy.
          </p>
          <p>UglyRobase is a registered LLC in Delaware, USA.</p>
          <p>For any privacy-related questions, you can reach us at support@imajinn.ai.</p>

          <h3>Sharing Your Data</h3>
          <p>
            We use third-party services (data processors) for our service. The extent to which your
            data is shared with these providers depends on your use of our services, and we list the
            specific third-parties in use (with links to their privacy policies) in the sections
            below.
          </p>
          <p>
            Each third-party provider has been vetted by our security team to ensure that privacy
            policies and practices meet or exceed the same levels of compliance and standards that
            we follow. Where appropriate and available, we hold additional signed Data Privacy
            Agreements with these companies as an additional layer of accountability in order to
            help ensure your data is safe and secure.
          </p>
          <p>
            We disclose potentially personally-identifying and personally-identifying information
            only to our employees, contractors and affiliated organizations that (i) need to know
            that information in order to process it on our behalf or to provide services, and (ii)
            that have agreed, in writing, not to disclose it to others. Some of those employees,
            contractors and affiliated organizations may be located outside of your home country; by
            using our websites and services, you consent to the transfer of such information to
            them. We will not rent or sell potentially personally-identifying and
            personally-identifying information to anyone.
          </p>
          <p>
            We may be required to disclose an individual’s personal information in response to a
            lawful request by public authorities, including to meet national security or law
            enforcement requirements.
          </p>
          <p>
            If we ever were to engage in any onward transfers of your data with third parties for a
            purpose other than which it was originally collected or subsequently authorized, we
            would provide you with an opt-out choice to limit the use and disclosure of your
            personal data.
          </p>

          <h3>Cookies</h3>
          <p>
            A cookie is a string of information that a website stores on a visitor’s computer, and
            that the visitor’s browser provides to the website each time the visitor returns. We use
            cookies across our sites to manage authentication and login. Visitors who do
            not wish to have cookies placed on their computers should set their browsers to refuse
            cookies before using our websites, with the drawback that certain features may not
            function properly without the aid of cookies.
          </p>

          <h3>Personal Data We Collect</h3>
          <h4>Registered Users</h4>
          <ul>
            <li>
              If you create an account on one of our sites, you will be prompted to provide your
              Email Address.
            </li>
            <li>
              Your Email Address is stored in Google Firebase Authentication. Your Email Address is used to
              send you an email with a link to set your password or to send you an email with a link
              to reset your password in the event you forget your password.
            </li>
            <li>Once an account is created, you must contact us to have it deleted.</li>
            <li>
              Accounts have a random userid assigned to them when they are
              created. They are private and cannot be changed.
            </li>
            <li>
              An anonymized string created from your email address (also called a hash) may be provided
              to the Gravatar service to see if a Profile picture of you is available for display.
              The Gravatar service privacy policy is available{' '}
              <a href="https://automattic.com/privacy/">here</a>.
            </li>

            <li>
              Your First Name, Last Name and Email Address are accessible by employees on
              the site.
            </li>
            <li>
              If you have an account and you log in to a site, we will set up several cookies to
              save your login information. These cookies will persist for two weeks. If you log out
              of your account, the login cookies will be removed. It is important that you log out
              if you are using a public computer.
            </li>
            <li>
              For users that register on one of our sites, we also store the data they provide in
              their profile indefinitely. All registered users can see, change or delete most of
              that data at any time.
            </li>
          </ul>
          
          <h4>Email/Chat/Contact Forms</h4>
          <ul>
            <li>
              We use Google/G Suite to process all internal email and communication with our
              customers. Google’s privacy policy is available{' '}
              <a href="https://policies.google.com/privacy?hl=en-US">here</a>.
            </li>
            <li>
              Customers that email us, use live chat, or use any of the contact forms on our
              websites, will have their email address, IP address, and any data provided in the
              contact form or body of the email stored in G Suite archives and in our help desk
              third-party service provider, HelpScout. The HelpScout privacy policy is found{' '}
              <a href="https://www.helpscout.com/company/legal/privacy/">here</a>.
            </li>
            <li>
              We keep all email and chat communication indefinitely to help us provide support and
              improve our services. Individuals can request copies of any previous correspondence
              with us at any time.
            </li>
          </ul>
          <h4>Embedded Content From Other Websites</h4>
          <p>
            Embeds are pieces from other websites that are shown from time to time on our websites.
            They behave in the exact same way as if the visitor has visited the other website and
            may use cookies or capture information. Typically embedded content is from websites that
            share videos, images, or other content. These services may collect your IP Address, your
            User Agent, store and retrieve cookies on your browser, embed additional third-party
            tracking, and monitor your interaction with that embedded content, including correlating
            your interaction with the content with your account with that service, if you are logged
            in to that service.
          </p>
          <p>
            Links to the privacy policies of the most common services have been included below.
            Where a general privacy policy is not available, the applicable country is indicated.
          </p>
          <p>&nbsp;</p>
          <ul>
            <li>
              <a
                href="https://www.amazon.com/gp/help/customer/display.html?nodeId=468496"
                target="_blank"
                rel="noreferrer noopener"
              >
                Amazon
              </a>
            </li>
            <li>
              <a
                href="https://animoto.com/legal/privacy_policy"
                target="_blank"
                rel="noreferrer noopener"
              >
                Animoto
              </a>
            </li>
            <li>
              <a href="https://blip.fm/corp/privacy" target="_blank" rel="noreferrer noopener">
                Blip
              </a>
            </li>
            <li>
              <a
                href="http://www.collegehumor.com/static/privacy/policy"
                target="_blank"
                rel="noreferrer noopener"
              >
                CollegeHumor
              </a>
            </li>
            <li>
              <a
                href="https://www.dailymotion.com/legal/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                DailyMotion
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/about/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href="https://policies.yahoo.com/privacy/flickr/"
                target="_blank"
                rel="noreferrer noopener"
              >
                Flickr
              </a>
            </li>
            <li>
              <a
                href="http://www.funnyordie.com/about/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                FunnyOrDie.com
              </a>
            </li>
            <li>
              <a href="https://www.hulu.com/privacy" target="_blank" rel="noreferrer noopener">
                Hulu
              </a>
            </li>
            <li>
              <a href="https://imgur.com/privacy" target="_blank" rel="noreferrer noopener">
                Imgur
              </a>
            </li>
            <li>
              <a
                href="https://help.instagram.com/155833707900388"
                target="_blank"
                rel="noreferrer noopener"
              >
                Instagram
              </a>
            </li>
            <li>
              <a href="https://issuu.com/legal/privacy" target="_blank" rel="noreferrer noopener">
                Issuu
              </a>
            </li>
            <li>
              <a
                href="https://www.kickstarter.com/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                Kickstarter
              </a>
            </li>
            <li>
              <a href="https://www.meetup.com/privacy/" target="_blank" rel="noreferrer noopener">
                Meetup.com
              </a>
            </li>
            <li>
              <a href="https://www.mixcloud.com/terms/" target="_blank" rel="noreferrer noopener">
                Mixcloud
              </a>
            </li>
            <li>
              <a href="http://photobucket.com/privacy" target="_blank" rel="noreferrer noopener">
                Photobucket
              </a>
            </li>
            <li>
              <a href="https://polldaddy.com/privacy/" target="_blank" rel="noreferrer noopener">
                PollDaddy
              </a>
            </li>
            <li>
              <a
                href="https://www.reddit.com/help/privacypolicy"
                target="_blank"
                rel="noreferrer noopener"
              >
                Reddit
              </a>
            </li>
            <li>
              <a
                href="https://www.reverbnation.com/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                ReverbNation
              </a>
            </li>
            <li>
              <a
                href="https://support.scribd.com/hc/en-us/articles/210129366-Privacy-policy"
                target="_blank"
                rel="noreferrer noopener"
              >
                Scribd (US)
              </a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/legal/privacy-policy"
                target="_blank"
                rel="noreferrer noopener"
              >
                SlideShare (LinkedIn)
              </a>
            </li>
            <li>
              <a
                href="https://www.smugmug.com/about/privacy/"
                target="_blank"
                rel="noreferrer noopener"
              >
                SmugMug
              </a>
            </li>
            <li>
              <a
                href="https://www.someecards.com/page/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                Someecards
              </a>
            </li>
            <li>
              <a
                href="https://soundcloud.com/pages/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                SoundCloud
              </a>
            </li>
            <li>
              <a href="https://speakerdeck.com/privacy" target="_blank" rel="noreferrer noopener">
                Speaker Deck
              </a>
            </li>
            <li>
              <a
                href="https://www.spotify.com/us/legal/privacy-policy/"
                target="_blank"
                rel="noreferrer noopener"
              >
                Spotify (US)
              </a>
            </li>
            <li>
              <a
                href="https://www.ted.com/about/our-organization/our-policies-terms/privacy-policy"
                target="_blank"
                rel="noreferrer noopener"
              >
                TED
              </a>
            </li>
            <li>
              <a
                href="https://www.tumblr.com/policy/en/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                Tumblr
              </a>
            </li>
            <li>
              <a href="https://twitter.com/en/privacy" target="_blank" rel="noreferrer noopener">
                Twitter
              </a>
            </li>
            <li>
              <a href="https://automattic.com/privacy/" target="_blank" rel="noreferrer noopener">
                VideoPress
              </a>
            </li>
            <li>
              <a href="https://vimeo.com/privacy" target="_blank" rel="noreferrer noopener">
                Vimeo
              </a>
            </li>
            <li>
              <a href="https://vine.co/privacy" target="_blank" rel="noreferrer noopener">
                Vine&nbsp;
              </a>
            </li>
            <li>
              <a
                href="https://wordpress.org/about/privacy/"
                target="_blank"
                rel="noreferrer noopener"
              >
                WordPress Plugin Directory&nbsp;
              </a>
            </li>
            <li>
              <a
                href="https://wordpress.org/about/privacy/"
                target="_blank"
                rel="noreferrer noopener"
              >
                WordPress.tv&nbsp;
              </a>
            </li>
            <li>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer noopener"
              >
                YouTube (Google)
              </a>
            </li>
          </ul>

          <h3>Analytics</h3>
          <ul>
            <li>
              We use Vercel Analytics for tracking visits and aggregating information about the
              traffic to our websites. This is cookieless and anonymized GDPR compliant tracking.
              The Vercel Analytics privacy policy can be found{' '}
              <a href="https://vercel.com/docs/sources/analytics/privacy">here</a>.
            </li>
          </ul>
          <h3>Marketing</h3>
          <ul>
            <li>
              We use email marketing to communicate with customers and potential customers from time
              to time. All email lists and campaigns are “opt-in” meaning we will not send you these
              sorts of emails unless you indicated that you wish to receive them during signup or
              other interactions on our website.
            </li>
            <li>
              We may send you “system” emails, such as password reset requests or payment
              notifications/receipts even if you have not opted-in to email marketing lists.
            </li>
            <li>
              All marketing emails sent by us will include an unsubscribe link in the footer of the
              email. Emails sent to you may also include standard tracking, including open and click
              activities.
              <br /> We use MailChimp. Mailchimp’s privacy policy is found{' '}
              <a href="https://mailchimp.com/legal/privacy/">here</a>.
            </li>
            <li>
              We may utilize social media and web advertising campaigns. These service providers use
              cookies on our sites and/or pixel tracking to serve ads across the different
              platforms.
              <ul>
                <li>
                  Google AdSense &amp; DoubleClick (
                  <a href="https://policies.google.com/privacy">privacy policy</a>
                  <span>&nbsp;</span>|<span>&nbsp;</span>
                  <a href="https://support.google.com/dfp_premium/answer/94152">opt out</a>)
                </li>
                <li>
                  Twitter (<a href="https://twitter.com/en/privacy">privacy policy</a>&nbsp;|
                  <span>&nbsp;</span>
                  <a href="https://help.twitter.com/en/safety-and-security/privacy-controls-for-tailored-ads">
                    opt out
                  </a>
                  )
                </li>
                <li>
                  Facebook (<a href="https://www.facebook.com/about/privacy/">privacy policy</a>
                  <span>&nbsp;</span>|<span>&nbsp;</span>
                  <a href="https://www.facebook.com/help/568137493302217">opt out</a>)
                </li>
              </ul>
            </li>
          </ul>

          <h3>Paying Customers</h3>
          <ul>
            <li>
              For payment transactions for Imajinn AI, we use Stripe.&nbsp;Stripe’s privacy policy
              can be found<span>&nbsp;</span>
              <a rel="noreferrer noopener" href="https://stripe.com/us/privacy" target="_blank">
                here
              </a>
              .
            </li>
            <li>
              To comply with accounting and legal requirements, we keep data on financial
              transactions in the systems above for up to 10 years.
            </li>
          </ul>

          <h3>
            Hosting and API Services
          </h3>
          <ul>
            <li>
              All web servers and hosting are managed by our team on Vercel, and Google Cloud
              platforms located in different regions around the world. This includes website
              hosting, backups, database, file storage, APIs, and log files. Vercel’s privacy policy
              can be found <a href="https://vercel.com/legal/privacy-policy">here</a>. Google Cloud
              privacy policies and terms can be found<span>&nbsp;</span>
              <a
                rel="noreferrer noopener"
                href="https://cloud.google.com/product-terms"
                target="_blank"
              >
                here
              </a>
              .
            </li>
            <li>
              Our services use Bunny.net Content Delivery Network (CDN). Bunny.net may store web log
              information of site visitors, including IPs, UA, referrer, Location and ISP info of
              site visitors. Files and images served by the CDN may be stored and served from
              countries other than your own. Bunny.net’s privacy policy can be found
              <span>&nbsp;</span>
              <a rel="noreferrer noopener" href="https://bunny.net/privacy/" target="_blank">
                here
              </a>
              .
            </li>
            <li>
              In order to run our Imajinn AI services, we receive and store your prompts, styles,
              arguments, uploaded images, and generated images made by users on your team that use
              the Imajinn service. This data may also be shared with our cloud provider Replicate.
              Replicate’s privacy policy can be found{' '}
              <a href="https://replicate.com/privacy">here</a>. Staff may have access to review this
              data for quality control and terms of service enforcement purposes. If you submit
              personally identifying information in your prompts, this is against our terms of
              service, but may be stored in our systems.
            </li>
          </ul>

          <h3>Your Rights</h3>
          <p>
            If you are a registered user you can request to see or download the data we have about
            you.
          </p>
          <p>
            For registered users or paying customers, this will also include profile information and
            download, payment, and support ticket histories.
          </p>
          <p>
            You can also request “to be forgotten” and we will erase any personally identifiable
            data we have about you. Of course, this excludes data we need for administrative or
            security purposes or if we are required by law to retain some of the data.
          </p>
          <p>
            An individual who seeks access, or who seeks to correct, amend, or delete inaccurate
            data, should direct his/her query to support@imajinn.aid. We will respond within a
            reasonable timeframe, not to exceed one week.
          </p>

          <h3>Protecting Your Data</h3>
          <p>
            The security and reliability of our service is our number one priority. We invest
            heavily in the training of our staff and our infrastructure to ensure that best
            practices are followed in everything that we do.
          </p>
          <ul>
            <li>
              Every Imajinn AI employee and contractor goes through an onboarding process. All staff
              only have access to systems that are directly required to complete the functions of
              their job. We use dual factor authentication for all critical systems and
              communications services.
            </li>
            <li>
              All staff (including any contractors) undergo initial training to ensure proper
              understanding of all security-related processes. Staff regularly attend industry
              conferences and otherwise stay informed of best practices and relevant trends. Staff
              review and agree, in writing, to all policies and procedures annually.
            </li>
            <li>
              We only use third-party services, such as Google Cloud, that are fully vetted and
              adhere to the highest levels of privacy and security practices.
            </li>
          </ul>
          <h3>Data Breach Procedures</h3>
          <p>
            Should any event occur where customer data has been lost, stolen, or potentially
            compromised, our policy is to alert our customers via email no later than 48 hours of
            our team becoming aware of the event. We will also report such incidents to any required
            data protection authority. We will work closely with any customers affected to determine
            next steps such as any end-user notifications, needed patches, and how to avoid any
            similar event in the future.
          </p>

          <h3>Privacy Shield Frameworks</h3>
          <p>
            Imajinn AI complies with the EU-U.S. Privacy Shield Framework and Swiss-U.S. Privacy
            Shield Framework as set forth by the U.S. Department of Commerce regarding the
            collection, use, and retention of personal information transferred from the European
            Union and Switzerland to the United States. Imajinn AI has certified to the Department
            of Commerce that it adheres to the Privacy Shield Principles. If there is any conflict
            between the terms in this privacy policy and the Privacy Shield Principles, the Privacy
            Shield Principles shall govern. To learn more about the Privacy Shield program, please
            visit <a href="https://www.privacyshield.gov/">privacyshield.gov</a>.
          </p>
          <p>
            In compliance with the Privacy Shield Principles, Imajinn AI commits to resolve
            complaints about our collection or use of your personal information. EU and Swiss
            individuals with inquiries or complaints regarding our Privacy Shield policy should
            first contact Imajinn AI at support@imajinn.ai.
          </p>
          <p>
            If we do not resolve your complaint, you may contact JAMS, our designated independent
            dispute resolution provider for Privacy Shield inquiries. You can contact JAMS, which is
            based in the United States, through its website at the following link:{' '}
            <a href="https://www.jamsadr.com/eu-us-privacy-shield">
              https://www.jamsadr.com/eu-us-privacy-shield
            </a>
          </p>
          <p>
            If neither Imajinn AI nor JAMS resolves your complaint, you may, in certain
            circumstances, be able to seek binding arbitration through the Privacy Shield Panel. You
            can read more about binding arbitration in Annex I to the Privacy Shield Principles.
          </p>
          <p>
            Imajinn AI commits to cooperate with EU data protection authorities (DPAs) and the Swiss
            Federal Data Protection and Information Commissioner (FDPIC) and comply with the advice
            given by such authorities with regard to human resources data transferred from the EU
            and Switzerland in the context of the employment relationship.
          </p>
          <p>
            Our commitments under the Privacy Shield are subject to the investigatory and
            enforcement powers of the United States Federal Trade Commission.
          </p>
        </ContentSection>
      </main>
      <Footer />
    </>
  )
}
