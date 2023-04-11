function Error({ statusCode }) {
  return (
    <section>
      <div className="min-h-screen px-4 mx-auto max-w-7xl px-12 py-24">
        <div className="flex flex-col w-full text-center">
          <p>
            {statusCode
              ? `An error ${statusCode} occurred while processing your request`
              : 'Whoops! Something went wrong...'}
          </p>
        </div>
      </div>
    </section>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error