# notification setup

the upstream watcher sends you a notification when it detects claude code changes and creates a draft PR.

## option 1: ntfy.sh (free, recommended)

push notifications to your phone. no account needed. completely free.

1. install the [ntfy app](https://ntfy.sh) on your phone (iOS / Android)
2. pick a private topic name (e.g., `claude-tips-abc123` -- make it hard to guess)
3. subscribe to that topic in the app
4. add the secret to your repo:
   ```
   gh secret set NTFY_TOPIC --body "claude-tips-abc123"
   ```

thats it. you'll get push notifications with a "Open PR" button.

## option 2: twilio SMS (~$1.15/mo)

real SMS to your phone number.

1. create a [Twilio account](https://www.twilio.com/try-twilio) (free trial includes $15 credit)
2. get a phone number ($1.00/mo)
3. add 4 secrets:
   ```
   gh secret set TWILIO_ACCOUNT_SID --body "AC..."
   gh secret set TWILIO_AUTH_TOKEN --body "..."
   gh secret set TWILIO_FROM_NUMBER --body "+1234567890"
   gh secret set NOTIFY_PHONE_NUMBER --body "+1987654321"
   ```

cost: $1/mo for the number + $0.0079/SMS. at 1-2 messages/day thats ~$1.15/mo total.

## option 3: both

set all secrets. both backends fire. belt and suspenders.

## quick merge from phone

when you get a notification:

1. **tap the PR link** to review the diff on GitHub (or GitHub Mobile)
2. if it looks good, either:
   - merge directly in GitHub Mobile
   - or go to **Actions → Quick Merge** in the repo, tap "Run workflow", enter the PR number

## required secret (for the pipeline itself)

the watcher needs a Claude API key to process changes through Haiku:

```
gh secret set ANTHROPIC_API_KEY --body "sk-ant-..."
```

cost per run: ~$0.01. at twice daily: ~$0.60/month.
