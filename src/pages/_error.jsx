const Error = ({ statusCode, statusMessage }) => {
  return (
    <main class="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div class="text-center">
        <h1 class="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">{statusCode}</h1>
        <p class="mt-6 text-base leading-7 text-gray-600">{statusMessage}</p>
        <div class="mt-10 flex items-center justify-center gap-x-6">
          <a href="/app" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Go back home</a>
          <a href="#" onClick={() => {DocsBotAI.open();}} class="text-sm font-semibold text-gray-900">Contact support <span aria-hidden="true">&rarr;</span></a>
        </div>
      </div>
    </main>
  )
}

const getStatusMessage = (statusCode) => {
  switch (statusCode) {
    case 404: return "Sorry, but we couldn't find the page you were looking for.";
    case 500: return "Sorry, but we encountered an internal server error while processing your request.";
    default: return "Whoops! An unknown error occurred!";
  }
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  const statusMessage = err ? err.statusMessage : getStatusMessage(statusCode)
  return { statusCode, statusMessage }
}

export default Error