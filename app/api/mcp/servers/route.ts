import { NextRequest, NextResponse } from 'next/server';

import { getMcpServerConfigs, getMcpTools } from '@/lib/mcp';
import type { McpServersResponse, ApiErrorResponse } from '@/types/api';

/**
 * GET /api/mcp/servers
 * Returns list of configured MCP servers and their available tools
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<McpServersResponse | ApiErrorResponse>> {
  try {
    const configs = getMcpServerConfigs();

    if (configs.length === 0) {
      return NextResponse.json<McpServersResponse>({
        servers: [],
      });
    }

    // Get tools for each server
    const servers = await Promise.all(
      configs.map(async (config) => {
        try {
          const tools = await getMcpTools(config);
          return {
            name: config.name,
            tools: tools.map((tool) => ({
              name: tool.name,
              description: tool.description || '',
              inputSchema: tool.inputSchema || {
                type: 'object',
                properties: {},
              },
            })),
          };
        } catch (error) {
          console.error(`Error getting tools for MCP server ${config.name}:`, error);
          return {
            name: config.name,
            tools: [],
          };
        }
      })
    );

    return NextResponse.json<McpServersResponse>({
      servers,
    });
  } catch (error: unknown) {
    console.error('Error listing MCP servers:', error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to list MCP servers';

    return NextResponse.json<ApiErrorResponse>(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined,
      },
      { status: 500 }
    );
  }
}

