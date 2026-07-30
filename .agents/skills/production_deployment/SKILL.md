---
name: production_deployment
description: Use this skill when deploying to production, running deployment scripts, or when asked to make changes to the live system. It contains rules for asking user permission and formatting choices.
---

# Production Auto-Deployment Rule

When resolving issues on the **Live System (Production)** or issues not originating from Localhost, the agent MUST ALWAYS ask a **Multiple-Choice Question (Choices)** using the `ask_question` tool to verify the user's consent before running any deployment command to Production. Only run `Deploy-All.bat` or related deploy commands IF the user explicitly permits it.
- NEVER run deployments arbitrarily. You must always wait for the user's choice via the modal first.

## Choice Options Format
When asking a multiple-choice question for planning or development, the options MUST strictly follow this format: 
`[{Plan Name}] | Priority: <Color Emoji> | Severity: <Color Emoji> | ~{Approximate File Count} files | ผลลัพธ์: {Extremely concise and direct result in Thai}`
Keep the option descriptions extremely short and straight to the point.
