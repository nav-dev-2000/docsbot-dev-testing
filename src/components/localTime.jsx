import NoSSR from '@mpth/react-no-ssr'

export default function LocalTime({ date, ...props }) {
  return (
    <NoSSR>
      <time dateTime={new Date(date).toISOString()} {...props}>{new Date(date).toLocaleString()}</time>
    </NoSSR>
  )
}
