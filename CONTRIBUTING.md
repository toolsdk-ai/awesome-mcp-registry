# 🤝 Contributing to the Awesome MCP Registry

Thanks for your interest in contributing to Awesome MCP Registry! 🎉 Your help makes this registry of Model Context Protocol servers even more awesome.

## 🚀 Submit New MCP Servers

Want to add a new MCP server to our registry? It's easy! Just follow these steps:

1. **Fork this repo** 🍴 - Click the fork button at the top right of this page
2. **Create a JSON file** 📄 - Add a new file named `your-mcp-server.json` in the [packages/uncategorized](./packages/uncategorized) folder. AI will automatically categorize it later.
3. **Fill in the details** ✍️ - Use the format below.
4. **Submit a pull request** 🚀 - We'll review it and merge it in!

If you know which category your server fits into, feel free to put it in the appropriate folder instead of `uncategorized`.

```json
{
  "type": "mcp-server",
  "name": "Github",
  "packageName": "@modelcontextprotocol/server-github",
  "description": "MCP server for using the GitHub API",
  "url": "https://github.com/modelcontextprotocol/servers/blob/main/src/github",
  "runtime": "node",
  "license": "MIT",
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": {
      "description": "Personal access token for GitHub API access",
      "required": true
    }
  }
}
```

> Every file that enters this repository will be validated by Zod. You can open [types.ts](./src/types.ts) to see the definition of the Zod schema.

Here's a list of fields you can use in your MCP server configuration:

| Field         | Type   | Required | Description                                                                                              |
| ------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------- |
| `type`        | string | Yes      | Must be `"mcp-server"`                                                                                   |
| `name`        | string | Yes      | Custom display name. If not provided, package name will be used                                          |
| `packageName` | string | Yes      | Name of the package (e.g. npm, PyPI, Maven package name)                                                 |
| `description` | string | No       | Description of the MCP server                                                                            |
| `url`         | string | No       | GitHub repository URL                                                                                    |
| `runtime`     | string | Yes      | Runtime environment. e.g. `"node"`, `"python"`, `"java"`, `"go"`                                         |
| `license`     | string | No       | Open source license (e.g. MIT, AGPL, GPL)                                                                |
| `env`         | object | Yes      | Environment variables required by the server. If no env is needed, you can fill in an empty object `{}`` |
| `logo`        | string | No       | URL to custom logo image                                                                                 |

Each environment variable in the env object should have:

- `description`: A brief description of what the variable is used for
- `required`: Boolean indicating if the variable is required

For more detail please see [the guide](./docs/guide.md).

## 💻 Code Contributions

We warmly welcome contributions to both our **code** and **documentation**.  
Whether you're fixing a small bug, improving performance, or adding an exciting new feature, your efforts are valued. 💪

### How You Can Contribute

- 🛠 **Fix bugs** — squash those pesky issues
- ✨ **Add new features** — bring your ideas to life
- 📚 **Improve documentation** — make it clearer and more complete
- ⚡ **Optimize code** — enhance performance and readability

Don't worry about perfection — **just submit your work**!  
Our team will review, provide feedback, and help polish it before merging. 🙌

> 💡 Tip: Even small changes matter — every pull request counts!

## 🎉 Thanks for Making MCP Awesome!

Your contributions help build a better ecosystem for everyone working with Model Context Protocol servers. Every addition matters! ❤️

For detailed technical information, check out our [complete guide](./docs/guide.md).
