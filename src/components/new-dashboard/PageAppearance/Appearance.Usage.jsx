import { useState } from 'react'
import Link from 'next/link'
import {
    ArrowTopRightOnSquareIcon,
    CheckIcon,
    ClipboardDocumentIcon,
    ClipboardIcon,
} from '@heroicons/react/24/outline'
import {
    AppearanceBlock,
    AppearanceCode,
    AppearanceInput,
} from './Appearance.Options'
import Button from '../Button'
import IconButton from '../IconButton'
import { formatDomainListInputText } from '@/lib/webSearch'

const AppearanceUsage = ({
    bot,
    team,
    allowedDomainsText,
    setAllowedDomainsText,
    setAllowedDomains,
    isUpdating,
}) => {
    const [copied, setCopied] = useState(false)
    const [copiedIframe, setCopiedIframe] = useState(false)
    const [copiedKey, setCopiedKey] = useState(false)

    const embed = `<script type="text/javascript">window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(e){return new Promise((t,r)=>{var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://widget.docsbot.ai/chat.js";let o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o),n.addEventListener("load",()=>{let n;Promise.all([new Promise((t,r)=>{window.DocsBotAI.mount(Object.assign({}, e)).then(t).catch(r)}),(n=function e(t){return new Promise(e=>{if(document.querySelector(t))return e(document.querySelector(t));let r=new MutationObserver(n=>{if(document.querySelector(t))return e(document.querySelector(t)),r.disconnect()});r.observe(document.body,{childList:!0,subtree:!0})})})("#docsbotai-root"),]).then(()=>t()).catch(r)}),n.addEventListener("error",e=>{r(e.message)})})};</script>
<script type="text/javascript">
  DocsBotAI.init({id: "${team.id}/${bot.id}"});
</script>`
    const iframe = `<iframe src="https://docsbot.ai/iframe/${team.id}/${bot.id}" width="600" height="650" frameborder="0" allowtransparency="true" scrolling="no"></iframe>`

    return (
        <>
            <AppearanceBlock
                title="Embed Methods"
                titleTag="h4"
                titleProps={{
                    className: '!text-base',
                }}
                description="Choose how to add the DocsBot widget to your website or platform."
            >
                <div className="flex flex-col gap-4">
                    <AppearanceBlock
                        title="Script Embed (Floating Widget)"
                        titleTag="h5"
                        titleProps={{
                            className: '!text-sm/6',
                        }}
                        description={
                            <>
                                Embed DocsBot as a floating widget on your
                                website by adding the following code to your
                                HTML page anywhere before the closing{' '}
                                <code className="font-bold">&lt;/body&gt;</code>{' '}
                                tag.
                            </>
                        }
                        isLast={true}
                    >
                        <AppearanceCode
                            isCopied={copied}
                            buttonProps={{
                                onClick: (e) => {
                                    e.preventDefault()
                                    navigator.clipboard.writeText(embed)
                                    setCopied(true)
                                    setTimeout(() => {
                                        setCopied(false)
                                    }, 2000)
                                },
                            }}
                        >
                            {embed}
                        </AppearanceCode>
                    </AppearanceBlock>

                    <AppearanceBlock
                        title="iFrame Embed"
                        titleTag="h5"
                        titleProps={{
                            className: '!text-sm/6',
                        }}
                        description="Embed DocsBot as an iframe into a page on your website or supported cloud services."
                        isLast={true}
                    >
                        <AppearanceCode
                            isCopied={copiedIframe}
                            buttonProps={{
                                onClick: (e) => {
                                    e.preventDefault()
                                    navigator.clipboard.writeText(iframe)
                                    setCopiedIframe(true)
                                    setTimeout(() => {
                                        setCopiedIframe(false)
                                    }, 2000)
                                },
                            }}
                        >
                            {iframe}
                        </AppearanceCode>
                    </AppearanceBlock>

                    <AppearanceBlock
                        title="Widget Documentation"
                        titleTag="p"
                        description="Learn about detailed setup instructions and advanced configuration options for the widget."
                        isLast={true}
                    >
                        <Button
                            theme="blue"
                            label="View Documentation"
                            icon={ArrowTopRightOnSquareIcon}
                            href="/documentation/developer/embeddable-chat-widget"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex"
                        />
                    </AppearanceBlock>
                </div>
            </AppearanceBlock>

            {bot.privacy === 'private' && (
                <AppearanceBlock
                    title="Signing Key"
                    titleTag="label"
                    titleProps={{
                        htmlFor: 'embedding-key',
                        className: '!text-base !font-bold',
                    }}
                    description="Manage credentials used to verify and authorize widget usage on your site."
                >
                    <div className="relative">
                        <AppearanceInput
                            type="text"
                            id="embedding-key"
                            value={bot.signatureKey}
                            className="pr-10"
                            readOnly
                        />

                        <IconButton
                            icon={copiedKey ? CheckIcon : ClipboardIcon}
                            label={copiedKey ? 'Copied!' : 'Copy Key'}
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            disabled={copiedKey}
                            onClick={(e) => {
                                e.preventDefault()
                                navigator.clipboard.writeText(bot.signatureKey)
                                setCopiedKey(true)
                                setTimeout(() => {
                                    setCopiedKey(false)
                                }, 2000)
                            }}
                        />
                    </div>
                </AppearanceBlock>
            )}

            <AppearanceBlock
                title="Allowed Domains"
                titleTag="label"
                titleProps={{
                    className: '!text-base !font-bold',
                }}
                description="Enter a comma-separated list of domains that are allowed to embed this widget. Any subdomains must be listed separately. Leave blank to allow all domains."
                isLast={true}
            >
                <AppearanceInput
                    type="text"
                    name="domains"
                    id="domains"
                    value={allowedDomainsText}
                    onChange={(e) => {
                        const formattedDomains = formatDomainListInputText(
                            e.target.value,
                        )
                        setAllowedDomainsText(formattedDomains)
                        setAllowedDomains(
                            formattedDomains
                                .split(',')
                                .filter((s) => s)
                                .map((d) =>
                                    d
                                        .trim()
                                        .toLowerCase()
                                        .replace(/^(https?:\/\/)/, '')
                                        .replace(/\/.*$/, ''),
                                )
                                .filter(Boolean),
                        )
                    }}
                    disabled={isUpdating}
                    placeholder="mysite.com, www.mysite.com, anotherdomain.com, etc"
                />
            </AppearanceBlock>
        </>
    )
}

export default AppearanceUsage
