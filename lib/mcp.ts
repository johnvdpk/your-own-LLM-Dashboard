import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ChildProcess } from 'child_process';

/**
 * MCP Client Manager
 * Manages connections to MCP servers and provides tool calling functionality
 */

export interface McpServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface McpClientConnection {
  client: Client;
  transport: StdioClientTransport;
}

// Store active MCP client connections
const activeConnections = new Map<string, McpClientConnection>();

/**
 * Get or create an MCP client connection
 * @param config MCP server configuration
 * @returns MCP client instance
 */
export async function getMcpClient(config: McpServerConfig): Promise<Client> {
  // Return existing connection if available
  if (activeConnections.has(config.name)) {
    const connection = activeConnections.get(config.name)!;
    // Check if client is still connected
    try {
      // Try to list tools to verify connection is alive
      await connection.client.listTools();
      return connection.client;
    } catch (error) {
      // Connection is dead, remove it
      console.warn(`MCP connection to ${config.name} is dead, reconnecting...`);
      activeConnections.delete(config.name);
    }
  }

  // Create new connection
  // Convert process.env to Record<string, string> by filtering out undefined values
  const processEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      processEnv[key] = value;
    }
  }

  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args || [],
    env: config.env ? { ...processEnv, ...config.env } : processEnv,
  });

  const client = new Client(
    {
      name: 'open-router-chat',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Connect to the server
  await client.connect(transport);

  // Store connection
  activeConnections.set(config.name, {
    client,
    transport,
  });

  return client;
}

/**
 * Close an MCP client connection
 * @param serverName Name of the server to close
 */
export async function closeMcpClient(serverName: string): Promise<void> {
  const connection = activeConnections.get(serverName);
  if (connection) {
    try {
      await connection.client.close();
    } catch (error) {
      console.error(`Error closing MCP client for ${serverName}:`, error);
    }
    activeConnections.delete(serverName);
  }
}

/**
 * Close all MCP client connections
 */
export async function closeAllMcpClients(): Promise<void> {
  const closePromises = Array.from(activeConnections.keys()).map((name) =>
    closeMcpClient(name)
  );
  await Promise.all(closePromises);
}

/**
 * Get available tools from an MCP server
 * @param config MCP server configuration
 * @returns List of available tools
 */
export async function getMcpTools(config: McpServerConfig) {
  const client = await getMcpClient(config);
  const toolsResponse = await client.listTools();
  return toolsResponse.tools || [];
}

/**
 * Call an MCP tool
 * @param config MCP server configuration
 * @param toolName Name of the tool to call
 * @param args Arguments for the tool
 * @returns Tool execution result
 */
export async function callMcpTool(
  config: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>
) {
  const client = await getMcpClient(config);
  const result = await client.callTool({
    name: toolName,
    arguments: args,
  });
  return result;
}

/**
 * Get MCP server configuration from environment variables
 * MCP servers are configured via environment variables in the format:
 * MCP_SERVER_<NAME>_COMMAND=<command>
 * MCP_SERVER_<NAME>_ARGS=<args> (JSON array, optional)
 * MCP_SERVER_<NAME>_ENV_<KEY>=<value> (optional environment variables)
 */
export function getMcpServerConfigs(): McpServerConfig[] {
  const configs: McpServerConfig[] = [];
  const serverNames = new Set<string>();

  // Find all MCP server configurations
  for (const [key, value] of Object.entries(process.env)) {
    const match = key.match(/^MCP_SERVER_([^_]+)_COMMAND$/);
    if (match) {
      serverNames.add(match[1]);
    }
  }

  // Build configurations
  for (const name of serverNames) {
    const commandKey = `MCP_SERVER_${name}_COMMAND`;
    const argsKey = `MCP_SERVER_${name}_ARGS`;
    const command = process.env[commandKey];

    if (!command) {
      continue;
    }

    const config: McpServerConfig = {
      name: name.toLowerCase(),
      command,
    };

    // Parse args if provided
    if (process.env[argsKey]) {
      try {
        config.args = JSON.parse(process.env[argsKey]);
      } catch (error) {
        console.error(`Error parsing args for MCP server ${name}:`, error);
      }
    }

    // Collect environment variables for this server
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      const envMatch = key.match(/^MCP_SERVER_${name}_ENV_(.+)$/);
      if (envMatch && value) {
        env[envMatch[1]] = value;
      }
    }
    if (Object.keys(env).length > 0) {
      config.env = env;
    }

    configs.push(config);
  }

  return configs;
}

