# ModelSelector

The `ModelSelector` component renders the OpenAI model picker with built-in
visibility rules for legacy and plan-limited models. It supports both
uncontrolled and controlled usage.

## Basic usage (uncontrolled)

```jsx
import ModelSelector from '@/components/ModelSelector'
;<ModelSelector team={team} />
```

- `team` is required for plan gating and model messaging.
- The component defaults to `gpt-5-mini` unless `defaultModel` is provided.
- Use `onModelChange` if you want to observe selection changes.

## Controlled usage

```jsx
import { useState } from 'react'
import ModelSelector from '@/components/ModelSelector'

const [model, setModel] = useState(bot?.model || 'gpt-5-mini')

<ModelSelector team={team} model={model} onModelChange={setModel} />
```

## Hook usage

```jsx
import { useModelSelector } from '@/components/ModelSelector'

const { model, modelVisibility, setModel } = useModelSelector({
  team,
  defaultModel: 'gpt-5-mini',
  short: true,
})
```

## Props

- `team` (required): used for plan permission checks and model messaging.
- `model` (optional): controlled selected model value.
- `onModelChange` (optional): called with the next model value.
- `defaultModel` (optional): initial model for uncontrolled mode.
- `short` (optional): limits the model list and shows helper text.
- `disabled` (optional): disables the radio inputs.
