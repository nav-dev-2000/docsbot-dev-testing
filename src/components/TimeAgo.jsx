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

  const offsetInMs = date.getTimezoneOffset() * 60 * 1000;
  const adjustedDate = new Date(date.getTime() + offsetInMs);
  const timeAgo = formatDistanceToNowStrict(adjustedDate, { addSuffix: true });
  
  return (
    <NoSSR>
      <time dateTime={adjustedDate.toISOString()} {...props}>{timeAgo}</time>
    </NoSSR>
  )
}