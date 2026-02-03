import Image from 'next/image'
import clsx from 'clsx'

function Row({ children }) {
  return (
    <div className="group relative">
      <div className="absolute inset-x-0 top-[1.425rem] h-0.5 bg-gradient-to-r from-white/15 from-[2px] to-[2px] bg-[length:12px_100%]" />
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-white/5 from-[2px] to-[2px] bg-[length:12px_100%] group-last:hidden" />
      {children}
    </div>
  )
}

function Logo({ label, src, className, alwaysAnimated = false }) {
  return (
    <div
      className={clsx(
        className,
        'absolute top-2 grid grid-cols-[1rem,1fr] items-center gap-2 whitespace-nowrap px-3 py-1',
        'rounded-full bg-gradient-to-t from-gray-800 from-50% to-gray-700 ring-1 ring-inset ring-white/10',
        '[--move-x-from:-100%] [--move-x-to:calc(100%+100cqw)] [animation-iteration-count:infinite] [animation-name:move-x] [animation-timing-function:linear]',
        alwaysAnimated 
          ? '[animation-play-state:running]' 
          : '[animation-play-state:paused] group-hover:[animation-play-state:running]',
      )}
    >
      <Image alt={label} src={src} className="size-4" aria-hidden="true" width={16} height={16} />
      <span className="text-sm/6 font-medium text-white">{label}</span>
    </div>
  )
}

export default function AnimatedTimeline({ variant = 'default', alwaysAnimated = false, icons = [] }) {
  if (variant === 'bento') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-slate-900">
        <div aria-hidden="true" className="relative h-full overflow-hidden group">
          <div className="absolute inset-0 top-8 z-10 flex items-center justify-center">
            <div
              className="absolute inset-0"
              style={{
                maskImage: `url('data:image/svg+xml,<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="96" height="96" rx="12" fill="black"/></svg>')`,
                maskPosition: 'center',
                maskRepeat: 'no-repeat',
              }}
            />
            <div className={clsx(
              "relative flex size-24 items-center justify-center rounded-xl bg-gradient-to-t from-white/5 to-white/25 shadow outline outline-offset-[-5px] outline-white/5 ring-1 ring-inset ring-white/10 before:absolute before:inset-0 before:rounded-xl before:opacity-75 before:bg-white/10",
              alwaysAnimated 
                ? "before:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" 
                : "group-hover:before:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
            )}>
              <Image
                src="/branding/docsbot-icon-sq.svg"
                alt="DocsBot Icon"
                width={72}
                height={72}
              />
            </div>
          </div>
          <div className="group absolute inset-0 grid grid-cols-1 pt-8 [container-type:inline-size]">
            {icons.map((row, rowIndex) => (
              <Row key={rowIndex}>
                {row.map((icon, iconIndex) => (
                  <Logo
                    key={iconIndex}
                    label={icon.label}
                    src={icon.src}
                    className={icon.className}
                    alwaysAnimated={alwaysAnimated}
                  />
                ))}
              </Row>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden pt-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-xl shadow-2xl ring-1 ring-white/10 bg-slate-900">
          <div aria-hidden="true" className="relative h-[500px] lg:h-[600px] overflow-hidden group">
            <div className="absolute inset-0 top-8 z-10 flex items-center justify-center">
              <div
                className="absolute inset-0"
                style={{
                  maskImage: `url('data:image/svg+xml,<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="96" height="96" rx="12" fill="black"/></svg>')`,
                  maskPosition: 'center',
                  maskRepeat: 'no-repeat',
                }}
              />
              <div className={clsx(
                "relative flex size-24 items-center justify-center rounded-xl bg-gradient-to-t from-white/5 to-white/25 shadow outline outline-offset-[-5px] outline-white/5 ring-1 ring-inset ring-white/10 before:absolute before:inset-0 before:rounded-xl before:opacity-75 before:bg-white/10",
                alwaysAnimated 
                  ? "before:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" 
                  : "group-hover:before:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
              )}>
                <Image
                  src="/branding/docsbot-icon-sq.svg"
                  alt="DocsBot Icon"
                  width={72}
                  height={72}
                />
              </div>
            </div>
            <div className="group absolute inset-0 grid grid-cols-1 pt-8 [container-type:inline-size]">
              {icons.map((row, rowIndex) => (
                <Row key={rowIndex}>
                  {row.map((icon, iconIndex) => (
                    <Logo
                      key={iconIndex}
                      label={icon.label}
                      src={icon.src}
                      className={icon.className}
                      alwaysAnimated={alwaysAnimated}
                    />
                  ))}
                </Row>
              ))}
            </div>
          </div>
          <div aria-hidden="true" className="relative">
            <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-gray-900 pt-[5%]" />
          </div>
        </div>
      </div>
    </div>
  )
} 