import Link from 'next/link'
import RadioField from '@/components/RadioField'
import { useModelSelector } from './ModelSelector.hooks'

export default function ModelSelector({
    team,
    model: modelProp,
    onModelChange,
    short = false,
    disabled = false,
    defaultModel = 'gpt-5-mini',
}) {
    const { model, modelVisibility, setModel, showHelperText } =
        useModelSelector({
            team,
            model: modelProp,
            onModelChange,
            short,
            defaultModel,
        })

    return (
        <fieldset>
            <legend className="text-sm font-medium text-gray-900">
                OpenAI Model
            </legend>
            <div className="mt-2 space-y-2">
                {modelVisibility['gpt-5.2'] && (
                    <RadioField
                        id="gpt-5-2"
                        name="model"
                        value="gpt-5.2"
                        checked={model === 'gpt-5.2'}
                        onChange={() => setModel('gpt-5.2')}
                        disabled={disabled}
                        descriptionId="gpt-5-2-description"
                        label={
                            <>
                                GPT-5.2 - Most Powerful
                                <span className="ml-4 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                    Recommended
                                </span>
                            </>
                        }
                        description={
                            <>
                                Latest flagship tuned for long-context work,
                                stronger tool use, and adaptive reasoning.{' '}
                                <span className="text-xs font-bold">
                                    Requires{' '}
                                    <Link
                                        href="https://help.openai.com/en/articles/10910291-api-organization-verification"
                                        target="_blank"
                                        className="underline hover:text-gray-800"
                                    >
                                        organization verification
                                    </Link>
                                    .
                                </span>
                            </>
                        }
                    />
                )}

                {modelVisibility['gpt-5.1'] && (
                    <RadioField
                        id="gpt-5-1"
                        name="model"
                        value="gpt-5.1"
                        checked={model === 'gpt-5.1'}
                        onChange={() => setModel('gpt-5.1')}
                        disabled={disabled}
                        descriptionId="gpt-5-1-description"
                        label="GPT-5.1 - Adaptive Flagship"
                        description={
                            <>
                                Previous flagship with adaptive reasoning and
                                fast responses for complex tasks.{' '}
                                <span className="text-xs font-bold">
                                    Requires{' '}
                                    <Link
                                        href="https://help.openai.com/en/articles/10910291-api-organization-verification"
                                        target="_blank"
                                        className="underline hover:text-gray-800"
                                    >
                                        organization verification
                                    </Link>
                                    .
                                </span>
                            </>
                        }
                    />
                )}

                {modelVisibility['gpt-5'] && (
                    <RadioField
                        id="gpt-5"
                        name="model"
                        value="gpt-5"
                        checked={model === 'gpt-5'}
                        onChange={() => setModel('gpt-5')}
                        disabled={disabled}
                        descriptionId="gpt-5-description"
                        label="GPT-5 - Powerful General-Purpose Model"
                        description={
                            <>
                                Smartest, fastest, most useful model yet, with
                                thinking built in — so you get the best answer,
                                every time.{' '}
                                <span className="text-xs font-bold">
                                    Requires{' '}
                                    <Link
                                        href="https://help.openai.com/en/articles/10910291-api-organization-verification"
                                        target="_blank"
                                        className="underline hover:text-gray-800"
                                    >
                                        organization verification
                                    </Link>
                                    .
                                </span>
                            </>
                        }
                    />
                )}

                {modelVisibility['gpt-4.1'] && (
                    <RadioField
                        id="gpt-4.1"
                        name="model"
                        value="gpt-4.1"
                        checked={model === 'gpt-4.1'}
                        onChange={() => setModel('gpt-4.1')}
                        disabled={disabled}
                        descriptionId="gpt-4.1-description"
                        label="GPT-4.1"
                        description="Previous generation model good at instruction following."
                    />
                )}

                {modelVisibility['gpt-5-mini'] && (
                    <RadioField
                        id="gpt-5-mini"
                        name="model"
                        value="gpt-5-mini"
                        checked={model === 'gpt-5-mini'}
                        onChange={() => setModel('gpt-5-mini')}
                        disabled={disabled}
                        descriptionId="gpt-5-mini-description"
                        label={
                            <>
                                GPT-5 mini - Best Value
                                <span className="ml-4 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                    Recommended
                                </span>
                            </>
                        }
                        description={
                            <>
                                Smart, fast, and useful model. Good for most
                                support use cases.{' '}
                                {team.supportsGPT4 && (
                                    <span className="text-xs font-bold">
                                        Requires{' '}
                                        <Link
                                            href="https://help.openai.com/en/articles/10910291-api-organization-verification"
                                            target="_blank"
                                            className="underline hover:text-gray-800"
                                        >
                                            organization verification
                                        </Link>
                                        .
                                    </span>
                                )}
                            </>
                        }
                    />
                )}

                {modelVisibility['gpt-4.1-mini'] && (
                    <RadioField
                        id="gpt-4.1-mini"
                        name="model"
                        value="gpt-4.1-mini"
                        checked={model === 'gpt-4.1-mini'}
                        onChange={() => setModel('gpt-4.1-mini')}
                        disabled={disabled}
                        descriptionId="gpt-4.1-mini-description"
                        label="GPT-4.1 mini"
                        description="Faster than GPT-4.1 while still good at instruction following."
                    />
                )}

                {modelVisibility['gpt-5-nano'] && (
                    <RadioField
                        id="gpt-5-nano"
                        name="model"
                        value="gpt-5-nano"
                        checked={model === 'gpt-5-nano'}
                        onChange={() => setModel('gpt-5-nano')}
                        disabled={disabled}
                        descriptionId="gpt-5-nano-description"
                        label="GPT-5 nano - Fast & Cost Effective"
                        labelClassName="font-medium text-gray-600"
                        description="Included in all plans. Affordable & extremely fast model."
                    />
                )}

                {modelVisibility['gpt-4.1-nano'] && (
                    <RadioField
                        id="gpt-4.1-nano"
                        name="model"
                        value="gpt-4.1-nano"
                        checked={model === 'gpt-4.1-nano'}
                        onChange={() => setModel('gpt-4.1-nano')}
                        disabled={disabled}
                        descriptionId="gpt-4.1-nano-description"
                        label="GPT-4.1 nano"
                        labelClassName="font-medium text-gray-600"
                        description="Previous generation model. We recommend upgrading to at least GPT-4.1 mini."
                    />
                )}

                {modelVisibility['gpt-4.5-preview'] && (
                    <RadioField
                        id="gpt-4.5-preview"
                        name="model"
                        value="gpt-4.5-preview"
                        checked={model === 'gpt-4.5-preview'}
                        onChange={() => setModel('gpt-4.5-preview')}
                        disabled={disabled}
                        descriptionId="gpt-4.5-preview-description"
                        label={
                            <>
                                GPT-4.5 - Not Recommended
                                <span className="ml-4 inline-flex items-center rounded-full bg-orange-600 px-2.5 py-0.5 text-xs font-medium text-white">
                                    Retiring June 2025
                                </span>
                            </>
                        }
                        labelClassName="font-medium text-gray-600"
                        description="Very slow, expensive ($0.27/question), and low rate limits. Not recommended for most use cases."
                    />
                )}

                {modelVisibility['gpt-4o'] && (
                    <RadioField
                        id="gpt-4o"
                        name="model"
                        value="gpt-4o"
                        checked={model === 'gpt-4o'}
                        onChange={() => setModel('gpt-4o')}
                        disabled={disabled}
                        descriptionId="gpt-4o-description"
                        label="GPT-4o"
                        labelClassName="font-medium text-gray-600"
                        description="Previous generation general purpose model. Consider upgrading to GPT-4.1."
                    />
                )}

                {modelVisibility['gpt-4o-mini'] && (
                    <RadioField
                        id="gpt-4o-mini"
                        name="model"
                        value="gpt-4o-mini"
                        checked={model === 'gpt-4o-mini'}
                        onChange={() => setModel('gpt-4o-mini')}
                        disabled={disabled}
                        descriptionId="gpt-4o-mini-description"
                        label="GPT-4o mini"
                        labelClassName="font-medium text-gray-600"
                        description="Previous generation model. Consider upgrading to GPT-4.1 mini."
                    />
                )}

                {modelVisibility['gpt-4-turbo'] && (
                    <RadioField
                        id="gpt-4-turbo"
                        name="model"
                        value="gpt-4-turbo"
                        checked={model === 'gpt-4-turbo'}
                        onChange={() => setModel('gpt-4-turbo')}
                        disabled={disabled}
                        descriptionId="gpt-4-turbo-description"
                        label="GPT-4 Turbo - Legacy"
                        labelClassName="font-medium text-gray-600"
                        description="Previous generation model. Recommend upgrading to GPT-4.1."
                    />
                )}

                {modelVisibility['gpt-4'] && (
                    <RadioField
                        id="gpt-4"
                        name="model"
                        value="gpt-4"
                        checked={model === 'gpt-4'}
                        onChange={() => setModel('gpt-4')}
                        disabled={disabled}
                        descriptionId="gpt-4-description"
                        label="GPT-4 - Legacy"
                        labelClassName="font-medium text-gray-600"
                        description="Previous generation model. Recommend upgrading to GPT-4.1."
                    />
                )}

                {modelVisibility['gpt-3.5-turbo'] && (
                    <RadioField
                        id="gpt-3.5-turbo"
                        name="model"
                        value="gpt-3.5-turbo"
                        checked={model === 'gpt-3.5-turbo'}
                        onChange={() => setModel('gpt-3.5-turbo')}
                        disabled={disabled}
                        descriptionId="gpt-3.5-turbo-description"
                        label="GPT 3.5 Turbo - Legacy"
                        labelClassName="font-medium text-gray-600"
                        description="Previous generation model. Recommend upgrading to GPT-4.1."
                    />
                )}

                {modelVisibility['gpt-3.5-turbo-0613'] && (
                    <RadioField
                        id="gpt-3.5-turbo-0613"
                        name="model"
                        value="gpt-3.5-turbo-0613"
                        checked={model === 'gpt-3.5-turbo-0613'}
                        onChange={() => setModel('gpt-3.5-turbo-0613')}
                        disabled={disabled}
                        descriptionId="gpt-3.5-turbo-0613-description"
                        label="GPT 3.5 Turbo (Old June 2023 Version) - Legacy"
                        labelClassName="font-medium text-gray-500"
                        description="The previous model retiring June 2024. Not recommended."
                    />
                )}
            </div>
            {showHelperText && (
                <p className="mt-2 text-xs text-gray-500">
                    More model choices available later in your bot settings
                </p>
            )}
        </fieldset>
    )
}
