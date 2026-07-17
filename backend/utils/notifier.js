// Notifier helper utility to dispatch structured JSON payloads to Slack and Discord webhooks
async function sendWebhookNotification(webhookUrl, messageText, metadata = null) {
  if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('http')) {
    return;
  }

  try {
    const isSlack = webhookUrl.includes('hooks.slack.com');
    const isDiscord = webhookUrl.includes('discord.com/api/webhooks') || webhookUrl.includes('discordapp.com/api/webhooks');

    let payload = {};

    if (isDiscord) {
      // Discord layout format
      let content = messageText;
      if (metadata) {
        content += '\n```json\n' + JSON.stringify(metadata, null, 2) + '\n```';
      }
      payload = { content };
    } else if (isSlack) {
      // Slack block formatting layout
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: messageText
          }
        }
      ];

      if (metadata) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '```json\n' + JSON.stringify(metadata, null, 2) + '\n```'
          }
        });
      }

      payload = {
        text: messageText,
        blocks
      };
    } else {
      // General generic webhook payload format
      payload = {
        message: messageText,
        metadata
      };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`[Notifier] Webhook responded with status: ${response.status}`);
    }
  } catch (err) {
    // Graceful catch blocks to prevent server thread crash
    console.error('[Notifier] Webhook notification dispatch failed:', err.message);
  }
}

module.exports = {
  sendWebhookNotification
};
