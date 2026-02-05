---
description: Master workflow to help users find the right tool.
---

# Master Router Workflow

**Use this when**: You don't know which workflow to use or need help choosing the right tool for the job.

## 1. Diagnostics

**Agent**: Ask the user: "What is your primary goal right now?"

## 2. Routing

Based on the answer, start the corresponding workflow:

### 🧠 Planning & Design

| User Goal | Workflow to Run |
| :--- | :--- |
| "New feature", "Brainstorming", "Concept" | `brainstorming` |
| "Design UI", "Mockup visuals" | `frontend-design` |
| "Complex task", "Multiple sub-tasks" | `parallel-orchestrator` |

### 🛠️ Building & Creating

| User Goal | Workflow to Run |
| :--- | :--- |
| "Create web artifact", "React Component" | `web-artifacts-builder` |
| "Create MCP Server", "Backend integration" | `mcp-builder` |

### 🔧 Maintenance & Quality

| User Goal | Workflow to Run |
| :--- | :--- |
| "Refactor code", "Cleanup" | `code-refactor` |
| "Fix bug", "Debug error", "Root cause" | `debugging-workflow` |
| "Security check", "Audit vulnerabilities" | `security-audit` |
| "Performance check", "Speed test" | `performance-audit` |

### 🚀 Operations & Release

| User Goal | Workflow to Run |
| :--- | :--- |
| "Test app", "Quality Assurance" | `webapp-testing` |
| "Release app", "Bump version" | `release-manager` |
| "Verify setup", "Environment check" | `setup-check` |

## 3. Fallback

If the request doesn't fit a specific workflow, help the user using standard agent capabilities or guide them to `brainstorming` if they need to clear up their requirements.
