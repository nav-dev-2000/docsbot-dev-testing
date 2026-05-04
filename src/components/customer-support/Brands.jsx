import Image from 'next/image'
import castosLogo from '@/images/logos/castos.svg'
import dollieLogo from '@/images/logos/logo-dollie.png'
import extendifyLogo from '@/images/logos/logo-extendify.png'
import conversionLogo from '@/images/logos/logo-conversion.svg'
import sonyLogo from '@/images/logos/logo-sony.svg'
import logoWingarc from '@/images/logos/logo-wingarc.png'
import WPMUDEVLogo from '@/components/WPMUDEVLogo'
import clsx from 'clsx'

const Title = ({ text }) => {
    return (
        <h2 className="text-center text-md/8 font-semibold text-neutral-50">
            { text }
        </h2>
    );
}

export const Brands = ({ title = "Trusted by global brands", transparent = false }) => {
    const cssLogo = {
        size: 'w-[6rem] lg:w-[8rem] h-auto flex-none',
        position: 'object-contain',
    }

    return (
        <div className={clsx('py-8 sm:py-12 border-none', transparent ? 'bg-transparent' : 'bg-gray-900')}>
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
                <Title text={title} />

                <div className="flex flex-wrap lg:flex-nowrap justify-center items-center gap-4 sm:gap-8 lg:gap-10 mt-8">
                    <Image
                        src={sonyLogo}
                        alt="Sony Logo"
                        className={clsx(cssLogo.size, cssLogo.position)}
                    />

                    <Image
                        src={castosLogo}
                        alt="Castos Logo"
                        className={clsx(cssLogo.size, cssLogo.position)}
                    />

                    <Image
                        src={extendifyLogo}
                        alt="Extendify Logo"
                        className={clsx(cssLogo.size, cssLogo.position)}
                    />

                    <Image
                        src={conversionLogo}
                        alt="Conversion Logo"
                        className={clsx(cssLogo.size, cssLogo.position)}
                    />

                    <Image
                        src={dollieLogo}
                        alt="Dollie Logo"
                        className={clsx(cssLogo.size, cssLogo.position)}
                    />

                    <Image
                        src={logoWingarc}
                        alt="WingArc1st Logo"
                        className={clsx(cssLogo.size, cssLogo.position)}
                    />

                    <WPMUDEVLogo className={clsx(cssLogo.size, cssLogo.position, 'text-white')} />
                </div>
            </div>
        </div>
    )
}
