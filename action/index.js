const { promises: { readFile } } = require('fs')

const { Octokit } = require('@octokit/rest')

const env = require('./lib/env')
const parse = require('./lib/parse')
const approve = require('./lib/approve')
const comment = require('./lib/comment')

async function main () {
  // over write default github token with the input if provided
  if (process.env.INPUT_GITHUB_TOKEN) process.env.GITHUB_TOKEN = process.env.INPUT_GITHUB_TOKEN

  // default value for target input
  if (!process.env.INPUT_TARGET) process.env.INPUT_TARGET = 'fetch'

  // validate env variables
  env()

  // init octokit
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: 'action-dependabot-auto-merge'
  })

  // find context data
  const contents = await readFile(process.env.GITHUB_EVENT_PATH)

  // parse data
  const event = JSON.parse(contents)

  // extract the title
  const { pull_request: { title } } = event

  const command = parse(title, { target: process.env.INPUT_TARGET })

  if (command === 'merge') {
    await approve(octokit, event)
    await comment(octokit, event, `@dependabot ${command}`)
  }
}

// awaiting top-level await
main()