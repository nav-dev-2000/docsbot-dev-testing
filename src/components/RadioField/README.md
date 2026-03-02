# RadioField

Reusable radio input with label/description content and optional layout control.

## Usage

```jsx
import RadioField from '@/components/RadioField'

;<RadioField
  id="privacy-public"
  name="privacy"
  value="public"
  checked={privacy === 'public'}
  onChange={() => setPrivacy('public')}
  descriptionId="privacy-public-description"
  label="Public access"
  description="Allows for embedding on the frontend of websites."
/>
```

## Props

- `id` (string, required): Used for input and label `htmlFor`.
- `name` (string, required): Radio group name.
- `value` (string, required): Value for the radio input.
- `checked` (boolean, required): Controlled checked state.
- `onChange` (function, required): Change handler.
- `disabled` (boolean): Disable the input.
- `label` (string | ReactNode, required): Label content.
- `description` (string | ReactNode): Description content.
- `layout` (`stacked` | `inline`): Controls label/description layout. Default `stacked`.
- `ariaDescribedBy` (string): `aria-describedby` attribute override.
- `descriptionId` (string): ID for the description element.
- `wrapperClassName` (string): Extra classes for the outer wrapper.
- `contentClassName` (string): Extra classes for the label/description container.
- `inputClassName` (string): Classes for the radio input.
- `labelClassName` (string): Classes for the label element.
- `descriptionClassName` (string): Classes for the description element.
- `inputProps` (object): Extra props passed to the input.
