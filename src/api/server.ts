import { ToolSDKApiClient } from 'toolsdk/api';

// Setup
const packageName = '@toolsdk.ai/tavily-mcp';
const envs = {
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
};

const toolKey = 'tavily-search';
const inputData = { query: 'What is the capital of France?' };

// 1 Initialize Client
const toolSDK = new ToolSDKApiClient({
  apiKey: process.env.TOOLSDK_AI_API_KEY || '',
  baseURL: process.env.TOOLSDK_BASE_URL,
});

// 2 Get Tools & Execute
const searchResult = await toolSDK.package(packageName, envs).run({
  toolKey,
  inputData,
});

console.log(searchResult);
