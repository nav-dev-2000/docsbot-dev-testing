# GlossaryEntry

The `GlossaryEntry` component renders a single glossary row with word and
translation inputs plus a remove button.

## Basic usage

```jsx
import { GlossaryEntry } from '@/components/GlossaryEntry'
;<GlossaryEntry
  entry={{ word: 'FAQ', translation: 'Frequently Asked Questions' }}
  onChange={(nextEntry) => setEntry(nextEntry)}
  onRemove={() => removeEntry()}
/>
```

## Props

- `entry` (optional): object with `word` and `translation` values.
- `onChange` (optional): called with `{ word, translation }` when edits commit.
- `onRemove` (optional): invoked when the remove button is clicked.
- `disabled` (optional): disables inputs and remove button.
- `wordPlaceholder` (optional): input placeholder for the word field.
- `translationPlaceholder` (optional): input placeholder for the translation field.
- `className` (optional): additional wrapper class names.
