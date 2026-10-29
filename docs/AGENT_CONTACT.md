# Agent contact: status and review

This is a durable, read-only contact queue, separate from the coding/PR pipeline.

Add a unique `{ "id": "lowercase-request-id", "issue": 28 }` to
`.github/agent-triggers/contact.json` on main. The issue must belong to the repository owner.
The commit starts `agent-contact.yml`; a fifteen-minute scheduled sweep recovers missed events.
GitHub can delay scheduled jobs, so this is not a real-time SLA.

Each request posts RECEIVED to its original issue before contacting either model.
Claude Messages API reviewer is clearly labelled as an API session. A separate actual
Claude Code CLI runs in bare mode with only Read/Glob/Grep tools. Its structured
result is checked and saved as a local report. It has no code
publication role in this workflow. Results and failures return to the original issue.
Bot replies do not trigger further calls. A finished request is never automatically repeated;
submit a new ID for an intentional retry. An abandoned receipt may be retried once after
thirty minutes. Secrets are not printed or included in context.

This does not connect historical interactive Claude chats or a user's local Claude Code
process. New sessions only know the repository and supplied issue history. The main
ChatGPT session reads these issue replies through GitHub; an OpenAI API call is not this chat.

For code implementation use the existing explicit EXECUTE/PR pipeline. Never use it
just to ask agents for status, because that pipeline requires a tangible PR.

Validation: `node --test tests/agent-contact.test.cjs`.
