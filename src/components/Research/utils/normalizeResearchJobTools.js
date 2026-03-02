export const normalizeResearchJobTools = (job, fallbackJob = null) => ({
    ...job,
    webSearch:
        typeof job?.webSearch === 'boolean'
            ? job.webSearch
            : (fallbackJob?.webSearch ?? false),
    codeInterpreter:
        typeof job?.codeInterpreter === 'boolean'
            ? job.codeInterpreter
            : (fallbackJob?.codeInterpreter ?? false),
    questionHistory:
        typeof job?.questionHistory === 'boolean'
            ? job.questionHistory
            : typeof job?.mcpQuestionHistorySearch === 'boolean'
              ? job.mcpQuestionHistorySearch
              : (fallbackJob?.questionHistory ?? false),
    docsSearch:
        typeof job?.docsSearch === 'boolean'
            ? job.docsSearch
            : typeof job?.mcpDeepResearch === 'boolean'
              ? job.mcpDeepResearch
              : (fallbackJob?.docsSearch ?? true),
})
