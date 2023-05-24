import sendEmail from '@/lib/sendEmail'

const sendInviteEmail = async (user, inviter, team) => {
  console.log('sending email:', user, inviter, team)
  const name = inviter.name || inviter.email
  const emailBody = `You have been invited by ${name} to join ${team.name} on DocsBot, a powerful platform for managing custom-trained AI chatbots!
  To get started, please follow these simple steps:
  <ol>
    <li>Click on the following link to accept your invitation and create your DocsBot account: <a href="https://docsbot.ai/register?redirect=/app/team">https://docsbot.ai/register?redirect=/app/team</a></li>
    <li>Once you've created your account, you'll be directed to the team's workspace on DocsBot. Here, you'll find all our bots, as well as any relevant documentation and resources.</li>
    <li>Feel free to explore the platform and familiarize yourself with its features. If you have any questions or need assistance, you can reach out to our support line by clicking on 'help' <a href="https://docsbot.ai/">here</a>.</li>
  </ol>`
  await sendEmail(user, `You've been invited to ${team.name} on DocsBot`, emailBody)
}

export default sendInviteEmail