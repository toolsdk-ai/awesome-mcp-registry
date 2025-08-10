import { ToolSDKApiClient } from 'toolsdk/api';

// 添加请求参数类型定义
export interface ExecuteToolRequest {
  packageName: string;
  toolKey: string;
  inputData: Record<string, unknown>;
  envs?: Record<string, string>;
}

export interface ExecuteToolResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class ToolSO {
  protected _apiKey: string;
  protected _baseURL: string;

  constructor(apiKey?: string, baseURL?: string) {
    this._apiKey = apiKey || process.env.TOOLSDK_AI_API_KEY || '';
    this._baseURL = baseURL || process.env.TOOLSDK_BASE_URL || '';
  }

  /**
   * 执行工具
   * @param request 工具执行请求参数
   * @returns 工具执行结果
   */
  async executeTool(request: ExecuteToolRequest): Promise<ExecuteToolResponse>  {
    const toolSDK = new ToolSDKApiClient({
      apiKey: this._apiKey,
      baseURL: this._baseURL,
    });

    const mcpPackage = await toolSDK.package(request.packageName, request.envs || {});

    const result = await mcpPackage.run({
      toolKey: request.toolKey,
      inputData: request.inputData,
    });

    return {
      success: true,
      data: result,
    };
  }
}
