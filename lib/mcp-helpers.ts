import { getMcpServerConfigs, getMcpTools, callMcpTool } from './mcp';
import type { McpServerConfig } from './mcp';

/**
 * Get all available MCP tools from all configured servers
 * @returns Array of tools with server information
 */
export async function getAllMcpTools() {
  try {
    const configs = getMcpServerConfigs();
    const allTools: Array<{
      serverName: string;
      toolName: string;
      description: string;
      inputSchema: unknown;
    }> = [];

    for (const config of configs) {
      try {
        const tools = await getMcpTools(config);
        for (const tool of tools) {
          allTools.push({
            serverName: config.name,
            toolName: tool.name,
            description: tool.description || '',
            inputSchema: tool.inputSchema || {},
          });
        }
      } catch (error) {
        console.error(`Error getting tools from ${config.name}:`, error);
        // Continue with other servers even if one fails
      }
    }

    return allTools;
  } catch (error) {
    console.error('Error in getAllMcpTools:', error);
    return [];
  }
}

/**
 * Generate system prompt text that describes available MCP tools
 * @returns System prompt text with tool descriptions
 */
export async function generateMcpToolsSystemPrompt(): Promise<string> {
  try {
    const tools = await getAllMcpTools();

    if (tools.length === 0) {
      return '';
    }

  let prompt = '\n\nJe hebt toegang tot de volgende MCP tools. Wanneer een gebruiker vraagt om acties uit te voeren die deze tools kunnen doen, gebruik dan het volgende format om een tool aan te roepen:\n\n';
  prompt += 'TOOL_CALL: <serverName>.<toolName> <JSON arguments>\n\n';
  prompt += 'Beschikbare tools:\n\n';

  // Group tools by server
  const toolsByServer = new Map<string, typeof tools>();
  for (const tool of tools) {
    if (!toolsByServer.has(tool.serverName)) {
      toolsByServer.set(tool.serverName, []);
    }
    toolsByServer.get(tool.serverName)!.push(tool);
  }

  for (const [serverName, serverTools] of toolsByServer) {
    prompt += `## Server: ${serverName}\n\n`;
    for (const tool of serverTools) {
      prompt += `- **${tool.toolName}**: ${tool.description}\n`;
      if (tool.inputSchema && typeof tool.inputSchema === 'object') {
        const schema = tool.inputSchema as { properties?: Record<string, unknown>; required?: string[] };
        if (schema.properties) {
          prompt += `  Parameters: ${Object.keys(schema.properties).join(', ')}\n`;
        }
      }
    }
    prompt += '\n';
  }

    prompt += 'Voorbeeld: Als een gebruiker vraagt "ga naar google.nl en maak een screenshot", gebruik dan:\n';
    prompt += 'TOOL_CALL: playwright.navigate_to_url {"url": "https://www.google.nl"}\n';
    prompt += 'TOOL_CALL: playwright.take_screenshot {"path": "google.png", "fullPage": true}\n\n';
    prompt += 'Na het uitvoeren van tools, beschrijf wat er is gebeurd aan de gebruiker.';

    return prompt;
  } catch (error) {
    console.error('Error generating MCP tools system prompt:', error);
    return '';
  }
}

/**
 * Parse tool calls from LLM response text
 * Format: TOOL_CALL: <serverName>.<toolName> <JSON arguments>
 * @param text LLM response text
 * @returns Array of parsed tool calls
 */
export function parseToolCalls(text: string): Array<{
  serverName: string;
  toolName: string;
  arguments: Record<string, unknown>;
}> {
  const toolCalls: Array<{
    serverName: string;
    toolName: string;
    arguments: Record<string, unknown>;
  }> = [];

  // Match TOOL_CALL: server.tool {json} - handle multiline JSON
  const toolCallRegex = /TOOL_CALL:\s*([^.]+)\.([^\s]+)\s+(\{[^}]*\}|\{[^}]*\{[^}]*\}[^}]*\})/gs;
  let match;

  while ((match = toolCallRegex.exec(text)) !== null) {
    const [, serverName, toolName, argsJson] = match;
    try {
      // Try to parse JSON - handle both single line and multiline
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(argsJson);
      } catch {
        // Try to extract JSON from potentially malformed string
        const jsonMatch = argsJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          args = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found');
        }
      }
      
      toolCalls.push({
        serverName: serverName.trim(),
        toolName: toolName.trim(),
        arguments: args,
      });
    } catch (error) {
      console.error(`Error parsing tool call arguments for ${serverName}.${toolName}:`, argsJson, error);
    }
  }

  return toolCalls;
}

/**
 * Execute tool calls and return results
 * @param toolCalls Array of tool calls to execute
 * @returns Array of tool execution results
 */
export async function executeToolCalls(
  toolCalls: Array<{
    serverName: string;
    toolName: string;
    arguments: Record<string, unknown>;
  }>
): Promise<Array<{ success: boolean; result: string; error?: string }>> {
  const configs = getMcpServerConfigs();
  const results: Array<{ success: boolean; result: string; error?: string }> = [];

  for (const toolCall of toolCalls) {
    const config = configs.find((c) => c.name.toLowerCase() === toolCall.serverName.toLowerCase());

    if (!config) {
      results.push({
        success: false,
        result: '',
        error: `Server "${toolCall.serverName}" not found`,
      });
      continue;
    }

    try {
      const result = await callMcpTool(config, toolCall.toolName, toolCall.arguments);
      const content = result.content || [];
      const textResult = content
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null && 'text' in item) {
            return String(item.text);
          }
          return String(item);
        })
        .join('\n');

      results.push({
        success: true,
        result: textResult,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        success: false,
        result: '',
        error: errorMessage,
      });
    }
  }

  return results;
}

