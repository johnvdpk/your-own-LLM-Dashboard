import { NextRequest, NextResponse } from 'next/server';

import { getMcpServerConfigs, callMcpTool } from '@/lib/mcp';
import type { McpToolCallRequest, McpToolCallResponse, ApiErrorResponse } from '@/types/api';

/**
 * POST /api/mcp/tools/call
 * Calls an MCP tool with the provided arguments
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<McpToolCallResponse | ApiErrorResponse>> {
  try {
    const body = await request.json() as McpToolCallRequest;
    const { serverName, toolName, arguments: args } = body;

    // Validate request
    if (!serverName || !toolName) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'serverName and toolName are required' },
        { status: 400 }
      );
    }

    if (!args || typeof args !== 'object') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'arguments must be an object' },
        { status: 400 }
      );
    }

    // Find server configuration
    const configs = getMcpServerConfigs();
    const config = configs.find((c) => c.name.toLowerCase() === serverName.toLowerCase());

    if (!config) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `MCP server "${serverName}" not found` },
        { status: 404 }
      );
    }

    // Call the tool
    const result = await callMcpTool(config, toolName, args);

    // Convert result to response format
    const content = result.content || [];
    const responseContent = content.map((item) => {
      if (typeof item === 'string') {
        return { type: 'text', text: item };
      }
      if (typeof item === 'object' && item !== null) {
        return {
          type: item.type || 'text',
          text: 'text' in item ? String(item.text) : undefined,
          ...item,
        };
      }
      return { type: 'text', text: String(item) };
    });

    return NextResponse.json<McpToolCallResponse>({
      success: true,
      content: responseContent,
    });
  } catch (error: unknown) {
    console.error('Error calling MCP tool:', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to call MCP tool';

    return NextResponse.json<McpToolCallResponse>(
      {
        success: false,
        content: [],
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

