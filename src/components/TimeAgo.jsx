import NoSSR from '@mpth/react-no-ssr'
import { formatDistanceToNowStrict } from 'date-fns';

export default function TimeAgo({ dateTime, ...props }) {
  // Return null if no dateTime is provided
  if (!dateTime) {
    return null;
  }

  // Safely create date object and validate
  const date = new Date(dateTime);
  if (isNaN(date.getTime())) {
    console.error('Invalid date provided to TimeAgo component:', dateTime);
    return null;
  }

  // Let the browser handle timezone conversion automatically
  const timeAgo = formatDistanceToNowStrict(date, { addSuffix: true });
  
  return (
    <NoSSR>
      <time dateTime={date.toISOString()} {...props}>{timeAgo}</time>
    </NoSSR>
  )
}