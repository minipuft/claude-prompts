import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { readFile, writeFile, appendFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";
import { z } from "zod";
import { Request, Response } from "express";
import {
  Config,
  TransportConfig,
  PromptData,
  PromptsFile,
  PromptsConfigFile,
  Message,
  Category
} from "./types.js";
import { 
  PromptError, 
  ArgumentError, 
  ValidationError, 
  handleError as utilsHandleError 
} from './utils/errorHandling.js';
import {
  validateJsonArguments,
  processTemplate as originalProcessTemplate
} from './utils/jsonUtils.js';
import * as fs from "fs/promises";
import { 
  readPromptFile, 
  parsePromptSections, 
  modifyPromptSection, 
  resolvePromptFilePath,
  safeWriteFile,
  performTransactionalFileOperations,
  findAndDeletePromptFile
} from './promptUtils.js';

// Extend the NodeJS global interface to include gc() function
declare global {
  namespace NodeJS {
    interface Global {
      gc?: () => void;
    }
  }
}

// Text Reference System
interface TextReference {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  lastUsed: number;
}

interface TextReferenceStore {
  references: TextReference[];
  maxAge: number; // Maximum age in milliseconds before cleanup
  maxSize: number; // Maximum number of references to store
}

// Initialize text reference storage
const textReferenceStore: TextReferenceStore = {
  references: [],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 1000 // Store up to 1000 references
};

// Function to generate a title for a text using Claude
async function generateTextTitle(text: string): Promise<string> {
  try {
    const titlePrompt = {
      id: "generate_title",
      name: "Generate Title",
      category: "system",
      description: "Generate a concise, descriptive title for a text",
      systemMessage: "Generate a concise, descriptive title (max 50 characters) that captures the essence of the provided text.",
      userMessageTemplate: "Text to generate title for:\n\n{{text}}",
      arguments: [{ name: "text", description: "Text to generate title for", required: true }]
    };

    const result = await runPromptDirectly(titlePrompt.id, { text });
    return result.trim();
  } catch (error) {
    log.error("Error generating title:", error);
    return `Text_${Date.now()}`;
  }
}

// Function to store a text reference
async function storeTextReference(text: string): Promise<string> {
  try {
    const title = await generateTextTitle(text);
    const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const reference: TextReference = {
      id,
      title,
      content: text,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    textReferenceStore.references.push(reference);
    
    // Clean up old references if we exceed maxSize
    if (textReferenceStore.references.length > textReferenceStore.maxSize) {
      cleanupOldReferences();
    }

    return `{{ref:${id}}}`;
  } catch (error) {
    log.error("Error storing text reference:", error);
    throw new Error(`Failed to store text reference: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to retrieve a text reference
function getTextReference(refId: string): string | null {
  const reference = textReferenceStore.references.find(ref => ref.id === refId);
  if (reference) {
    reference.lastUsed = Date.now();
    return reference.content;
  }
  return null;
}

// Function to clean up old references
function cleanupOldReferences() {
  const now = Date.now();
  textReferenceStore.references = textReferenceStore.references
    .filter(ref => (now - ref.lastUsed) < textReferenceStore.maxAge)
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, textReferenceStore.maxSize);
}

// Function to list available references
function listTextReferences(): Array<{ id: string; title: string; createdAt: number }> {
  return textReferenceStore.references.map(ref => ({
    id: ref.id,
    title: ref.title,
    createdAt: ref.createdAt
  }));
}

// Get the available tools as a formatted string
function getAvailableTools(): string {
  // This is a placeholder implementation. In a real implementation, 
  // you would dynamically fetch available tools from the MCP server.
  // For now, we'll return a static instruction about tools usage.
  return `You have access to a set of tools to help solve tasks. 
Use the following format to utilize these tools:

<tool_calls>
<tool_call name="TOOL_NAME">
<tool_parameters>
PARAMETERS_IN_JSON_FORMAT
</tool_parameters>
</tool_call>
</tool_calls>

Always check if a tool is appropriate for the task at hand before using it.
Use tools only when necessary to complete the task.`;
}

// Text reference system functions
async function processTemplateAsync(template: string, args: Record<string, string>, specialContext: Record<string, string> = {}, toolsEnabled: boolean = false): Promise<string> {
  // First, store any long text arguments as references
  const processedArgs = { ...args };
  for (const [key, value] of Object.entries(processedArgs)) {
    if (value && value.length > 500) { // Store texts longer than 500 characters as references
      processedArgs[key] = await storeTextReference(value);
    }
  }

  // Add tools_available to specialContext if tools are enabled
  const enhancedSpecialContext = { ...specialContext };
  if (toolsEnabled) {
    enhancedSpecialContext['tools_available'] = getAvailableTools();
  }

  // Process the template with the modified arguments
  let processedTemplate = originalProcessTemplate(template, processedArgs, enhancedSpecialContext);

  // Replace any reference placeholders with their content
  processedTemplate = processedTemplate.replace(/{{ref:([^}]+)}}/g, (match, refId) => {
    const content = getTextReference(refId);
    return content || match; // Keep the reference placeholder if content not found
  });

  return processedTemplate;
}

// Synchronous version that doesn't handle long text references
function processTemplate(template: string, args: Record<string, string>, specialContext: Record<string, string> = {}, toolsEnabled: boolean = false): string {
  // Add tools_available to specialContext if tools are enabled
  const enhancedSpecialContext = { ...specialContext };
  if (toolsEnabled) {
    enhancedSpecialContext['tools_available'] = getAvailableTools();
  }

  // Process the template with the arguments directly
  let processedTemplate = originalProcessTemplate(template, args, enhancedSpecialContext);

  // Replace any reference placeholders with their content
  processedTemplate = processedTemplate.replace(/{{ref:([^}]+)}}/g, (match, refId) => {
    const content = getTextReference(refId);
    return content || match; // Keep the reference placeholder if content not found
  });

  return processedTemplate;
}

/**
 * ========================================
 * TABLE OF CONTENTS
 * ========================================
 * 
 * 1. CONFIGURATION AND SETUP (lines ~22-92)
 *    - Command line arguments parsing
 *    - Configuration loading from config.json
 *    - Environment setup
 * 
 * 2. LOGGING SETUP (lines ~93-165)
 *    - Log file initialization
 *    - Custom logging functions
 *    - Startup information logging
 * 
 * 3. TYPES AND INTERFACES (lines ~166-180)
 *    - ConvertedPrompt interface definition
 * 
 * 4. PROMPT LOADING AND PROCESSING (lines ~181-264)
 *    - loadPromptFile function to read from markdown
 *    - convertMarkdownPromptsToJson function
 *    - Placeholder validation and verification
 * 
 * 5. SERVER CREATION AND TOOL DEFINITIONS (lines ~265-505)
 *    - MCP Server initialization
 *    - process_slash_command tool implementation (lines ~270-440)
 *      - Command parsing
 *      - listprompts command handling
 *      - Prompt matching and argument processing
 *    - listprompts tool implementation (lines ~440-505)
 * 
 * 6. PROMPT REGISTRATION (lines ~510-580)
 *    - Converting prompts to JSON structures
 *    - Registering prompts with server
 *    - Argument schema creation
 *    - Prompt handler functions
 * 
 * 7. TRANSPORT SETUP (lines ~580-720)
 *    - STDIO transport configuration
 *    - SSE transport with Express configuration
 *    - HTTP endpoints setup
 * 
 * 8. SERVER STARTUP AND ERROR HANDLING (lines ~720-745)
 *    - Server startup
 *    - Graceful shutdown handling
 *    - Uncaught exception handling
 * 
 * Note: Line numbers are approximate and may change as the file is modified.
 * When making changes, consider updating this table of contents.
 */

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up file logging for better debugging
const LOG_FILE = path.join(__dirname, "..", "server.log");

// Parse command line arguments first, before logging functions are created
const args = process.argv.slice(2);
const transportArg = args.find((arg: string) => arg.startsWith("--transport="));

// Load configuration early
const CONFIG_FILE = path.join(__dirname, "..", "config.json");
let config: Config;

try {
  const configContent = await readFile(CONFIG_FILE, "utf8");
  config = JSON.parse(configContent) as Config;
} catch (error) {
  console.error(`Error loading configuration from ${CONFIG_FILE}:`, error);
  console.info("Using default configuration");
  config = {
    server: {
      name: "Claude Custom Prompts",
      version: "1.0.0",
      port: 3456
    },
    prompts: {
      file: "prompts.json"
    },
    transports: {
      default: "sse",
      sse: { enabled: true },
      stdio: { enabled: true }
    }
  };
}

// Now we can determine the transport
const transport = transportArg 
  ? transportArg.split("=")[1] 
  : config.transports.default;

// Start with a clean log file
async function initLogFile() {
  try {
    await writeFile(LOG_FILE, `--- MCP Server Log Started at ${new Date().toISOString()} ---\n`, 'utf8');
  } catch (error) {
    console.error(`Error initializing log file:`, error);
  }
}

await initLogFile();

async function logToFile(level: string, message: string, ...args: any[]) {
  try {
    let logMessage = `[${new Date().toISOString()}] [${level}] ${message}`;
    if (args.length > 0) {
      logMessage += ` ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`;
    }
    await appendFile(LOG_FILE, logMessage + '\n', 'utf8');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

// Set up logging for debugging
const log = {
  info: (message: string, ...args: any[]) => {
    // Only log to console when not using STDIO transport
    if (transport !== "stdio") {
      console.log(`[INFO] ${message}`, ...args);
    }
    logToFile('INFO', message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    // Only log to console when not using STDIO transport
    if (transport !== "stdio") {
      console.error(`[ERROR] ${message}`, ...args);
    }
    logToFile('ERROR', message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    // Only log to console when not using STDIO transport
    if (transport !== "stdio" && process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
    logToFile('DEBUG', message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    // Only log to console when not using STDIO transport
    if (transport !== "stdio") {
      console.warn(`[WARN] ${message}`, ...args);
    }
    logToFile('WARN', message, ...args);
  }
};

// Log startup information - this will be redirected to file if in STDIO mode
log.info(`Server starting up - Process ID: ${process.pid}`);
log.info(`Node version: ${process.version}`);
log.info(`Working directory: ${process.cwd()}`);
log.info(`Module path: ${__dirname}`);
log.info(`Using transport: ${transport}`);
log.info(`Command-line arguments: ${JSON.stringify(process.argv)}`);
log.info(`Loaded configuration from ${CONFIG_FILE}`);

// Use configuration values
const PROMPTS_FILE = path.join(__dirname, "..", config.prompts.file);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : config.server.port;

log.debug("Configuration:", JSON.stringify(config, null, 2));

// Check if the selected transport is enabled
if (!config.transports[transport] || !(config.transports[transport] as TransportConfig).enabled) {
  log.error(`Transport '${transport}' is not enabled in the configuration`);
  process.exit(1);
}

// Load prompts
let promptsData: PromptData[] = [];
let categories: Category[] = [];

try {
  // Load prompts from category-specific files
  const result = await loadCategoryPrompts(PROMPTS_FILE);
  
  // Update the global variables
  promptsData = result.promptsData;
  categories = result.categories;
  
  log.info(`Loaded ${promptsData.length} prompts and ${categories.length} categories from ${PROMPTS_FILE}`);
} catch (error) {
  log.error(`Error loading prompts from ${PROMPTS_FILE}:`, error);
  process.exit(1);
}

// Define the ConvertedPrompt interface based on its usage in the codebase
interface ConvertedPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  systemMessage?: string;
  userMessageTemplate: string;
  arguments: Array<{
    name: string;
    description?: string;
    required: boolean;
  }>;
  // Chain-related properties
  isChain?: boolean;                   // Whether this prompt is a chain of prompts
  chainSteps?: Array<{
    promptId: string;                  // ID of the prompt to execute in this step
    stepName: string;                  // Name of this step
    inputMapping?: Record<string, string>; // Maps chain inputs to this step's inputs
    outputMapping?: Record<string, string>; // Maps this step's outputs to chain outputs
  }>;
  tools?: boolean;                     // Whether this prompt should use available tools
}

// Function to load prompt content from markdown file
async function loadPromptFile(filePath: string): Promise<{ 
  systemMessage?: string; 
  userMessageTemplate: string;
  isChain?: boolean;
  chainSteps?: Array<{
    promptId: string;
    stepName: string;
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
  }>;
}> {
  try {
    const fullPath = path.join(__dirname, "..", filePath);
    const content = await readFile(fullPath, "utf8");
    
    // Extract system message and user message template from markdown
    const systemMessageMatch = content.match(/## System Message\s*\n([\s\S]*?)(?=\n##|$)/);
    const userMessageMatch = content.match(/## User Message Template\s*\n([\s\S]*?)(?=\n##|$)/);
    
    const systemMessage = systemMessageMatch ? systemMessageMatch[1].trim() : undefined;
    const userMessageTemplate = userMessageMatch ? userMessageMatch[1].trim() : "";
    
    // Extract chain information if present
    const chainMatch = content.match(/## Chain Steps\s*\n([\s\S]*?)(?=\n##|$)/);
    let isChain = false;
    let chainSteps: Array<{
      promptId: string;
      stepName: string;
      inputMapping?: Record<string, string>;
      outputMapping?: Record<string, string>;
    }> = [];
    
    if (chainMatch) {
      isChain = true;
      const chainContent = chainMatch[1].trim();
      // Updated regex to match the current markdown format
      const stepMatches = chainContent.matchAll(/(\d+)\.\s*promptId:\s*([^\n]+)\s*\n\s*stepName:\s*([^\n]+)(?:\s*\n\s*inputMapping:\s*([\s\S]*?)(?=\s*\n\s*(?:outputMapping|promptId|\d+\.|$)))?\s*(?:\n\s*outputMapping:\s*([\s\S]*?)(?=\s*\n\s*(?:promptId|\d+\.|$)))?\s*/g);
      
      for (const match of stepMatches) {
        const [_, stepNumber, promptId, stepName, inputMappingStr, outputMappingStr] = match;
        
        const step: {
          promptId: string;
          stepName: string;
          inputMapping?: Record<string, string>;
          outputMapping?: Record<string, string>;
        } = {
          promptId: promptId.trim(),
          stepName: stepName.trim(),
        };
        
        if (inputMappingStr) {
          try {
            // Parse YAML-style mapping into JSON object
            const inputMapping: Record<string, string> = {};
            const lines = inputMappingStr.trim().split('\n');
            for (const line of lines) {
              const [key, value] = line.trim().split(':').map(s => s.trim());
              if (key && value) {
                inputMapping[key] = value;
              }
            }
            step.inputMapping = inputMapping;
          } catch (e) {
            log.warn(`Invalid input mapping in chain step ${stepNumber} of ${filePath}: ${e}`);
          }
        }
        
        if (outputMappingStr) {
          try {
            // Parse YAML-style mapping into JSON object
            const outputMapping: Record<string, string> = {};
            const lines = outputMappingStr.trim().split('\n');
            for (const line of lines) {
              const [key, value] = line.trim().split(':').map(s => s.trim());
              if (key && value) {
                outputMapping[key] = value;
              }
            }
            step.outputMapping = outputMapping;
          } catch (e) {
            log.warn(`Invalid output mapping in chain step ${stepNumber} of ${filePath}: ${e}`);
          }
        }
        
        chainSteps.push(step);
      }
      
      log.debug(`Loaded chain with ${chainSteps.length} steps from ${filePath}`);
    }
    
    if (!userMessageTemplate && !isChain) {
      throw new Error(`No user message template found in ${filePath}`);
    }
    
    return { systemMessage, userMessageTemplate, isChain, chainSteps };
  } catch (error) {
    log.error(`Error loading prompt file ${filePath}:`, error);
    throw error;
  }
}

// New function to convert markdown prompts to JSON structure in memory
async function convertMarkdownPromptsToJson(promptsData: PromptData[]): Promise<ConvertedPrompt[]> {
  const convertedPrompts: ConvertedPrompt[] = [];
  
  log.info(`Converting ${promptsData.length} markdown prompts to JSON structure...`);
  
  for (const promptData of promptsData) {
    try {
      // Load the prompt file content
      const promptFile = await loadPromptFile(promptData.file);
      
      // Create converted prompt structure
      const convertedPrompt: ConvertedPrompt = {
        id: promptData.id,
        name: promptData.name,
        description: promptData.description,
        category: promptData.category,
        systemMessage: promptFile.systemMessage,
        userMessageTemplate: promptFile.userMessageTemplate,
        arguments: promptData.arguments.map(arg => ({
          name: arg.name,
          description: arg.description,
          required: arg.required
        })),
        // Include chain information if this is a chain
        isChain: promptFile.isChain || false,
        chainSteps: promptFile.chainSteps || [],
        tools: promptData.tools || false
      };
      
      convertedPrompts.push(convertedPrompt);
    } catch (error) {
      log.error(`Error converting prompt ${promptData.id}:`, error);
      // Continue with other prompts even if one fails
    }
  }
  
  log.info(`Successfully converted ${convertedPrompts.length} prompts`);
  return convertedPrompts;
}

// Create MCP server
const server = new McpServer({
  name: config.server.name,
  version: config.server.version
});

// Create a simple conversation history tracker
const conversationHistory: Array<{
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isProcessedTemplate?: boolean; // Flag to indicate if this is a processed template rather than original user input
}> = [];

// Define maximum history size to prevent memory leaks
const MAX_HISTORY_SIZE = 100;

// Function to add items to conversation history with size management
function addToConversationHistory(item: {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isProcessedTemplate?: boolean;
}) {
  conversationHistory.push(item);
  
  // Trim history if it exceeds maximum size
  if (conversationHistory.length > MAX_HISTORY_SIZE) {
    // Remove oldest entries, keeping recent ones
    conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_SIZE);
    log.debug(`Trimmed conversation history to ${MAX_HISTORY_SIZE} entries to prevent memory leaks`);
  }
}

// Function to get the previous message from conversation history
function getPreviousMessage(): string {
  // Try to find the last user message in conversation history
  if (conversationHistory.length > 0) {
    // Start from the end and find the first non-template user message
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const historyItem = conversationHistory[i];
      // Only consider user messages that aren't processed templates
      if (historyItem.role === "user" && !historyItem.isProcessedTemplate) {
        log.debug(`Found previous user message for context: ${historyItem.content.substring(0, 50)}...`);
        return historyItem.content;
      }
    }
  }
  
  // Return a default prompt if no suitable history item is found
  return "[Please check previous messages in the conversation for context]";
}

// Standardized error handling
function handleError(error: unknown, context: string): { message: string; isError: boolean } {
  return utilsHandleError(error, context, log);
}

// Process the prompt with the parsed arguments and optional system message
async function runPromptDirectly(promptId: string, parsedArgs: Record<string, string>): Promise<string> {
  try {
    const convertedPrompt = convertedPrompts.find(cp => cp.id === promptId);
    if (!convertedPrompt) {
      throw new PromptError(`Could not find prompt with ID: ${promptId}`);
    }
    
    log.debug(`Running prompt directly: ${promptId} with arguments:`, parsedArgs);
    
    // Check for missing arguments but treat all as optional
    const missingArgs = convertedPrompt.arguments
      .filter(arg => !parsedArgs[arg.name])
      .map(arg => arg.name);
    
    if (missingArgs.length > 0) {
      log.info(`Missing arguments for '${promptId}': ${missingArgs.join(", ")}. Will attempt to use conversation context.`);
      
      // Use previous_message for all missing arguments
      missingArgs.forEach(argName => {
        parsedArgs[argName] = `{{previous_message}}`;
      });
    }
    
    // Create user message with placeholders replaced
    let userMessageText = convertedPrompt.userMessageTemplate;
    
    // Set up special context values
    const specialContext = {
      "previous_message": getPreviousMessage()
    };
    
    // Process the template to replace all placeholders, passing the tools flag
    userMessageText = await processTemplateAsync(userMessageText, parsedArgs, specialContext, convertedPrompt.tools || false);
    
    // Add the message to conversation history
    addToConversationHistory({
      role: "user",
      content: userMessageText,
      timestamp: Date.now(),
      isProcessedTemplate: true
    });
    
    // Generate a response (echo in this MCP implementation)
    const response = `Processed prompt: ${promptId}\nWith message: ${userMessageText}`;
    
    // Store the response in conversation history
    addToConversationHistory({
      role: "assistant",
      content: response,
      timestamp: Date.now()
    });
    
    return response;
  } catch (error) {
    const { message } = handleError(error, `Error executing prompt '${promptId}'`);
    return message;
  }
}

// Execute a chain of prompts
async function executePromptChain(
  chainPromptId: string, 
  inputArgs: Record<string, string> = {}
): Promise<{
  results: Record<string, string>;
  messages: { role: "user" | "assistant"; content: { type: "text"; text: string; }; }[];
}> {
  try {
    // Find the chain prompt
    const chainPrompt = convertedPrompts.find(cp => cp.id === chainPromptId);
    
    if (!chainPrompt) {
      throw new PromptError(`Could not find chain prompt with ID: ${chainPromptId}`);
    }
    
    // Validate that this is a chain prompt with steps
    if (!chainPrompt.isChain || !chainPrompt.chainSteps || chainPrompt.chainSteps.length === 0) {
      throw new ValidationError(`Prompt '${chainPromptId}' is not a valid chain or has no steps.`);
    }
    
    const totalSteps = chainPrompt.chainSteps.length;
    log.info(`Executing prompt chain: ${chainPrompt.name} (${chainPrompt.id}) with ${totalSteps} steps`);
    
    // Store results from each step that can be used as inputs for subsequent steps
    const results: Record<string, string> = { ...inputArgs };
    const messages: { role: "user" | "assistant"; content: { type: "text"; text: string; }; }[] = [];
    
    // Add chain start message to conversation history
    addToConversationHistory({
      role: "system" as any, // Type cast as any since the function expects "user" | "assistant"
      content: `Starting prompt chain: ${chainPrompt.name} (${totalSteps} steps)`,
      timestamp: Date.now()
    });
    
    // Execute each step in sequence
    for (let i = 0; i < chainPrompt.chainSteps.length; i++) {
      const step = chainPrompt.chainSteps[i];
      const currentStepNumber = i + 1;
      
      log.info(`Executing chain step ${currentStepNumber}/${totalSteps}: ${step.stepName} (${step.promptId})`);
      
      // Add step context to the results object so it can be used in templates
      results['current_step_number'] = String(currentStepNumber);
      results['total_steps'] = String(totalSteps);
      results['current_step_name'] = step.stepName;
      
      // Prepare arguments for this step based on input mappings
      const stepArgs: Record<string, string> = {};
      
      // Map inputs from results according to input mappings
      if (step.inputMapping) {
        for (const [stepInput, resultKey] of Object.entries(step.inputMapping)) {
          if (results[resultKey] !== undefined) {
            stepArgs[stepInput] = results[resultKey];
          } else {
            log.warn(`Missing input mapping for step '${step.stepName}': ${resultKey} -> ${stepInput}`);
          }
        }
      }
      
      // Add step context to the arguments
      stepArgs['step_number'] = String(currentStepNumber);
      stepArgs['total_steps'] = String(totalSteps);
      stepArgs['step_name'] = step.stepName;
      
      try {
        // Add step start message to conversation history
        addToConversationHistory({
          role: "system" as any, // Type cast as any since the function expects "user" | "assistant"
          content: `Executing chain step ${currentStepNumber}/${totalSteps}: ${step.stepName}`,
          timestamp: Date.now()
        });
        
        // Run the prompt for this step
        const stepResult = await runPromptDirectly(step.promptId, stepArgs);
        
        // Store the result
        if (step.outputMapping) {
          for (const [resultKey, stepOutput] of Object.entries(step.outputMapping)) {
            // For now, we only support mapping the entire output to a result key
            results[resultKey] = stepResult;
          }
        }
        
        // Add more detailed step messages to conversation history
        messages.push({
          role: "user",
          content: { 
            type: "text", 
            text: `[Chain Step ${currentStepNumber}/${totalSteps}: ${step.stepName} (${step.promptId})]` 
          }
        });
        
        messages.push({
          role: "assistant",
          content: { 
            type: "text", 
            text: stepResult 
          }
        });
        
        // Add step completion message to conversation history
        addToConversationHistory({
          role: "system" as any, // Type cast as any since the function expects "user" | "assistant"
          content: `Completed chain step ${currentStepNumber}/${totalSteps}: ${step.stepName}`,
          timestamp: Date.now()
        });
      } catch (stepError) {
        const { message, isError } = handleError(stepError, `Error executing chain step '${step.stepName}'`);
        
        // Add error message to the results
        results[`error_${step.promptId}`] = message;
        
        // Add error message to conversation history
        messages.push({
          role: "user",
          content: { 
            type: "text", 
            text: `[Chain Step ${currentStepNumber}/${totalSteps}: ${step.stepName} (${step.promptId})]` 
          }
        });
        
        messages.push({
          role: "assistant",
          content: { 
            type: "text", 
            text: message 
          }
        });
        
        // If this is a critical error, we may want to stop the chain execution
        if (isError) {
          throw new PromptError(`Chain execution stopped due to error in step ${currentStepNumber}/${totalSteps} '${step.stepName}': ${message}`);
        }
      }
    }
    
    // Add chain completion message to conversation history
    addToConversationHistory({
      role: "system" as any, // Type cast as any since the function expects "user" | "assistant"
      content: `Completed prompt chain: ${chainPrompt.name} (all ${totalSteps} steps)`,
      timestamp: Date.now()
    });
    
    log.info(`Chain execution completed successfully: ${chainPrompt.id}`);
    
    return {
      results,
      messages
    };
  } catch (error) {
    const { message } = handleError(error, `Error executing prompt chain '${chainPromptId}'`);
    
    return {
      results: { error: message },
      messages: [{
        role: "assistant",
        content: { 
          type: "text", 
          text: message 
        }
      }]
    };
  }
}

// Add global state for tracking current chain execution
// This needs to be added before the process_slash_command definition
// Add it right after the conversationHistory definition (around line ~370)

// Chain execution state tracking
interface ChainExecutionState {
  chainId: string;
  currentStepIndex: number;
  totalSteps: number;
  stepResults: Record<string, string>;
  startTime: number;
}

// Current active chain execution (only one at a time for simplicity)
let currentChainExecution: ChainExecutionState | null = null;



// Modify the process_slash_command tool to use the validation utility
server.tool(
  "process_slash_command",
  "Process commands that trigger prompt templates with optional arguments",
  {
    command: z.string().describe("The command to process, e.g., '>>content_analysis Hello world' or '/content_analysis Hello world'")
  },
  async ({ command }, extra) => {
    try {
      log.info(`Processing command: ${command}`);
      
      // Store original user input in conversation history
      addToConversationHistory({
        role: "user",
        content: command,
        timestamp: Date.now()
      });
      
      // Extract the command name and arguments
      // Format: >>command_name argument_text or /command_name argument_text
      // The new preferred format is >> but we still support / for backward compatibility
      const match = command.match(/^(>>|\/)([a-zA-Z0-9_-]+)\s*(.*)/);
      
      if (!match) {
        throw new ValidationError("Invalid command format. Use >>command_name [arguments] or /command_name [arguments]");
      }
      
      const [, prefix, commandName, commandArgs] = match;
      
      // Find the matching prompt
      const matchingPrompt = promptsData.find(
        prompt => prompt.id === commandName || prompt.name === commandName
      );
      
      if (!matchingPrompt) {
        throw new PromptError(`Unknown command: ${prefix}${commandName}. Type >>listprompts to see available commands.`);
      }
      
      // Parse arguments
      const promptArgValues: Record<string, string> = {};
      
      if (commandArgs) {
        if (matchingPrompt.arguments.length === 0) {
          log.warn(`Command '${prefix}${commandName}' doesn't accept arguments, but arguments were provided: ${commandArgs}`);
        } else if (matchingPrompt.arguments.length === 1 && 
                  (!commandArgs.trim().startsWith("{") || !commandArgs.trim().endsWith("}"))) {
          // Single argument, not in JSON format, assign directly
          promptArgValues[matchingPrompt.arguments[0].name] = commandArgs.trim();
        } else {
          // Try to parse as JSON if it looks like JSON
          try {
            if (commandArgs.trim().startsWith("{") && commandArgs.trim().endsWith("}")) {
              const parsedArgs = JSON.parse(commandArgs);
              
              // Validate the parsed JSON against expected arguments
              const validation = validateJsonArguments(parsedArgs, matchingPrompt);
              
              if (!validation.valid && validation.errors) {
                // Instead of throwing an error, log it and use previous_message
                log.warn(`Invalid arguments for ${prefix}${commandName}: ${validation.errors.join(', ')}. Using previous message instead.`);
                // Use previous_message for all arguments
                matchingPrompt.arguments.forEach(arg => {
                  promptArgValues[arg.name] = `{{previous_message}}`;
                });
              } else {
                // Use the sanitized arguments
                Object.assign(promptArgValues, validation.sanitizedArgs || {});
              }
            } else if (matchingPrompt.arguments.length === 1) {
              // Single argument, but not in JSON format
              promptArgValues[matchingPrompt.arguments[0].name] = commandArgs;
            } else {
              // Instead of throwing an error for multi-argument prompts with incorrect format,
              // log a warning and use previous_message for all arguments
              log.warn(`Multi-argument prompt requested (${matchingPrompt.arguments.length} args). Command arguments not in JSON format. Using previous message instead.`);
              matchingPrompt.arguments.forEach(arg => {
                promptArgValues[arg.name] = `{{previous_message}}`;
              });
            }
          } catch (e) {
            if (e instanceof ValidationError || e instanceof ArgumentError) {
              // Instead of re-throwing, log the error and use previous_message
              log.warn(`Error with arguments for ${prefix}${commandName}: ${e.message}. Using previous message instead.`);
              matchingPrompt.arguments.forEach(arg => {
                promptArgValues[arg.name] = `{{previous_message}}`;
              });
            } else {
              log.debug("Error parsing JSON arguments:", e);
              // For other errors, use previous_message for all arguments
              matchingPrompt.arguments.forEach(arg => {
                promptArgValues[arg.name] = `{{previous_message}}`;
              });
            }
          }
        }
      }
      
      log.debug("Prepared arguments for prompt:", promptArgValues);
      
      // Ensure all defined arguments have values (using previous_message as fallback)
      matchingPrompt.arguments.forEach(arg => {
        if (!promptArgValues[arg.name]) {
          promptArgValues[arg.name] = `{{previous_message}}`;
        }
      });
      
      // Find the converted prompt with template data
      const convertedPrompt = convertedPrompts.find(cp => cp.id === matchingPrompt.id);
      
      if (!convertedPrompt) {
        throw new PromptError(`Could not find converted prompt data for ${matchingPrompt.id}`);
      }
      
      // Check if this is a chain prompt
      if (convertedPrompt.isChain && convertedPrompt.chainSteps && convertedPrompt.chainSteps.length > 0) {
        log.info(`Command '${prefix}${commandName}' is a chain prompt with ${convertedPrompt.chainSteps.length} steps. NOT automatically executing the chain.`);
        
        // No longer automatically execute the entire chain
        // Instead, we'll process this as a regular prompt
        
        // Regular prompt processing continues below
      }
      
      // If this is a chain prompt, we need to handle it differently
      if (convertedPrompt.isChain) {
        // For chain prompts, we'll return a message that explains the chain and its steps
        const chainSteps = convertedPrompt.chainSteps || [];
        
        // Create a message that explains the chain and its steps
        const chainExplanation = [
          `This is a prompt chain: ${convertedPrompt.name} (${convertedPrompt.id})`,
          `It consists of ${chainSteps.length} steps that should be executed in sequence:`,
          ...chainSteps.map((step: any, index: number) => 
            `${index + 1}. ${step.stepName} (${step.promptId})`
          ),
          `\nTo execute this chain, run each step in sequence using the '>>' or '/' command syntax:`,
          ...chainSteps.map((step: any, index: number) => 
            `${index + 1}. >>${step.promptId} [with appropriate arguments]`
          ),
          `\nEach step will use outputs from previous steps as inputs for the next step.`
        ].join('\n');
        
        return { 
          content: [{ 
            type: "text", 
            text: chainExplanation
          }]
        };
      }
      
      // For all prompts, continue with the original processing
      // Create the prompt handler function similar to the one used for regular prompts
      const messages: { role: "user" | "assistant"; content: { type: "text"; text: string } }[] = [];
      
      // Create user message with placeholders replaced
      let userMessageText = convertedPrompt.userMessageTemplate;
      
      // If there's a system message, prepend it to the user message
      if (convertedPrompt.systemMessage) {
        userMessageText = `[System Info: ${convertedPrompt.systemMessage}]\n\n${userMessageText}`;
      }
      
      // Set up special context values
      const specialContext = {
        "previous_message": getPreviousMessage()
      };
      
      // Process the template to replace all placeholders
      userMessageText = await processTemplateAsync(userMessageText, promptArgValues, specialContext, convertedPrompt.tools || false);
      
      // Store the processed message in history as a user message
      // This ensures that getPreviousMessage() can find it when needed for the {{previous_message}} placeholder
      addToConversationHistory({
        role: "user",  // Use "user" role to ensure it's findable by getPreviousMessage()
        content: userMessageText,
        timestamp: Date.now(),
        isProcessedTemplate: true  // Mark this as a processed template, not original user input
      });
      
      messages.push({
        role: "user",
        content: {
          type: "text",
          text: userMessageText
        }
      });
      
      // Return the processed message
      return { 
        content: [{ 
          type: "text", 
          text: userMessageText
        }]
      };
    } catch (error) {
      const { message, isError } = handleError(error, "Error processing command");
      return { 
        content: [{ 
          type: "text", 
          text: message
        }],
        isError
      };
    }
  }
);

// Register the listprompts tool
server.tool(
  "listprompts",
  {
    command: z.string().optional().describe("Optional filter text to show only matching commands")
  },
  async ({ command }, extra) => {
    try {
      // Check if the command is actually a listprompts command
      const match = command ? command.match(/^(>>|\/)listprompts\s*(.*)/) : null;
      const filterText = match ? match[2].trim() : '';
      
      let listpromptsText = "# Available Commands\n\n";
      
      // Group prompts by category
      const promptsByCategory: Record<string, ConvertedPrompt[]> = {};
      
      // Find the category names for better display
      const categoryMap: Record<string, string> = {};
      categories.forEach(cat => {
        categoryMap[cat.id] = cat.name;
        promptsByCategory[cat.id] = [];
      });
      
      // Group the prompts
      convertedPrompts.forEach(prompt => {
        if (!promptsByCategory[prompt.category]) {
          promptsByCategory[prompt.category] = [];
        }
        promptsByCategory[prompt.category].push(prompt);
      });
      
      // Add each category and its prompts to the listprompts text
      Object.entries(promptsByCategory).forEach(([categoryId, prompts]) => {
        if (prompts.length === 0) return;
        
        const categoryName = categoryMap[categoryId] || categoryId;
        listpromptsText += `## ${categoryName}\n\n`;
        
        // Add each prompt in this category
        prompts.forEach(prompt => {
          listpromptsText += `### /${prompt.id}\n`;
          if (prompt.name !== prompt.id) {
            listpromptsText += `*Alias: /${prompt.name}*\n\n`;
          } else {
            listpromptsText += "\n";
          }
          
          listpromptsText += `${prompt.description}\n\n`;
          
          // Add argument details if any
          if (prompt.arguments.length > 0) {
            listpromptsText += "**Arguments:**\n\n";
            
            prompt.arguments.forEach(arg => {
              // Always show arguments as optional since we're treating them that way
              listpromptsText += `- \`${arg.name}\` (optional): ${arg.description || 'No description'}\n`;
            });
            
            // Add usage examples based on number of arguments
            listpromptsText += "\n**Usage:**\n\n";
            
            if (prompt.arguments.length === 1) {
              const argName = prompt.arguments[0].name;
              listpromptsText += `\`/${prompt.id} your ${argName} here\`\n\n`;
            } else if (prompt.arguments.length > 1) {
              // For multiple arguments, show JSON format
              const exampleArgs: Record<string, string> = {};
              prompt.arguments.forEach(arg => {
                exampleArgs[arg.name] = `<your ${arg.name} here>`;
              });
              
              listpromptsText += `\`/${prompt.id} ${JSON.stringify(exampleArgs)}\`\n\n`;
            }
          }
        });
      });
      
      // Special commands
      listpromptsText += "## Special Commands\n\n";
      
      // Add the listprompts command itself
      listpromptsText += "### >>listprompts\n\n";
      listpromptsText += "Lists all available commands and their usage.\n\n";
      listpromptsText += "**Usage:** `>>listprompts` or `/listprompts`\n\n";
      
      return {
        content: [{ type: "text", text: listpromptsText }]
      };
    } catch (error) {
      log.error("Error executing listprompts command:", error);
      return {
        content: [{ 
          type: "text", 
          text: `Error displaying listprompts: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// Register the update_prompt tool
server.tool(
  "update_prompt",
  {
    id: z.string().describe("Unique identifier for the prompt"),
    name: z.string().describe("Display name for the prompt"),
    category: z.string().describe("Category this prompt belongs to"),
    description: z.string().describe("Description of the prompt"),
    systemMessage: z.string().optional().describe("Optional system message for the prompt"),
    userMessageTemplate: z.string().describe("Template for generating the user message"),
    arguments: z.array(
      z.object({
        name: z.string().describe("Name of the argument"),
        description: z.string().optional().describe("Optional description of the argument"),
        required: z.boolean().describe("Whether this argument is required")
      })
    ).describe("Arguments accepted by this prompt"),
    isChain: z.boolean().optional().describe("Whether this prompt is a chain of prompts"),
    chainSteps: z.array(
      z.object({
        promptId: z.string().describe("ID of the prompt to execute in this step"),
        stepName: z.string().describe("Name of this step"),
        inputMapping: z.record(z.string()).optional().describe("Maps chain inputs to this step's inputs"),
        outputMapping: z.record(z.string()).optional().describe("Maps this step's outputs to chain outputs")
      })
    ).optional().describe("Steps in the chain if this is a chain prompt"),
    restartServer: z.boolean().optional().describe("Whether to restart the server after updating the prompt")
  },
  async (args, extra) => {
    try {
      log.info(`Updating prompt: ${args.id}`);
      
      // Read the main prompts configuration file
      const PROMPTS_FILE = path.join(__dirname, "..", config.prompts.file);
      const fileContent = await readFile(PROMPTS_FILE, "utf8");
      const promptsConfig = JSON.parse(fileContent) as PromptsConfigFile;
      
      // Ensure categories array exists
      if (!promptsConfig.categories) {
        log.warn(`promptsConfig.json does not have a 'categories' array. Initializing it.`);
        promptsConfig.categories = [];
      }
      
      // Ensure imports array exists
      if (!promptsConfig.imports) {
        log.warn(`promptsConfig.json does not have an 'imports' array. Initializing it.`);
        promptsConfig.imports = [];
      }
      
      // Check if the category exists
      const categoryExists = promptsConfig.categories.some(cat => cat.id === args.category.toLowerCase().replace(/\s+/g, "-"));
      let effectiveCategory = args.category.toLowerCase().replace(/\s+/g, "-"); // Clean category ID
      
      // If the category doesn't exist, create it
      if (!categoryExists) {
        log.info(`Category '${args.category}' does not exist. Creating it automatically.`);
        
        // Generate a clean category ID
        const categoryId = effectiveCategory;
        const categoryName = args.category; // Use original name for display
        const categoryDescription = `Prompts related to ${args.category}`;
        
        // Add the new category to the prompts file
        promptsConfig.categories.push({ 
          id: categoryId, 
          name: categoryName, 
          description: categoryDescription 
        });
        
        // Create the category directory
        const categoryDirPath = path.join(__dirname, "..", "prompts", categoryId);
        try {
          await fs.mkdir(categoryDirPath, { recursive: true });
          log.info(`Created directory for new category: ${categoryDirPath}`);
          
          // Create a prompts.json file for the new category
          const categoryPromptsPath = path.join(categoryDirPath, "prompts.json");
          const categoryPrompts = {
            prompts: [] // Start with an empty array of prompts
          };
          
          try {
            await safeWriteFile(categoryPromptsPath, JSON.stringify(categoryPrompts, null, 2), "utf8");
            log.info(`Created prompts.json file for new category: ${categoryPromptsPath}`);
            
            // Add the category file to imports in the main prompts.json
            const relativeCategoryPath = path.join("prompts", categoryId, "prompts.json").replace(/\\/g, '/');
            
            if (!promptsConfig.imports.includes(relativeCategoryPath)) {
              promptsConfig.imports.push(relativeCategoryPath);
              log.info(`Added ${relativeCategoryPath} to imports in main promptsConfig.json`);
            }
          } catch (error) {
            log.error(`Error creating prompts.json for category ${categoryId}:`, error);
            // Continue even if file creation fails
          }
        } catch (error) {
          log.error(`Error creating directory ${categoryDirPath}:`, error);
          return {
            content: [
              {
                type: "text",
                text: `Failed to create directory for category '${args.category}'.`
              }
            ],
            isError: true
          };
        }
        
        log.info(`Created new category: '${args.category}' with ID: '${categoryId}'`);
      }
      
      // Determine the file path for the prompt
      const promptFilename = `${args.id}.md`;
      const promptFilePath = path.join("prompts", effectiveCategory, promptFilename);
      const fullPromptFilePath = path.join(__dirname, "..", promptFilePath);
      
      // Find the category-specific prompts.json file
      const categoryPromptsPath = path.join(__dirname, "..", "prompts", effectiveCategory, "prompts.json");
      
      // Read or create the category prompts file
      let categoryPrompts: { prompts: PromptData[] };
      try {
        const categoryPromptsContent = await readFile(categoryPromptsPath, "utf8");
        categoryPrompts = JSON.parse(categoryPromptsContent);
        
        // Ensure it has a prompts array
        if (!categoryPrompts.prompts) {
          categoryPrompts.prompts = [];
        }
      } catch (error) {
        log.warn(`Could not read category prompts file ${categoryPromptsPath}, creating new file.`);
        categoryPrompts = { prompts: [] };
      }
      
      // Check if the prompt already exists in the category file
      const existingPromptIndex = categoryPrompts.prompts.findIndex(p => p.id === args.id);
      const promptExists = existingPromptIndex !== -1;
      
      // If the prompt exists, get its current file path
      let currentPromptFilePath = '';
      if (promptExists) {
        const currentPrompt = categoryPrompts.prompts[existingPromptIndex];
        const categoryFolder = path.join(__dirname, "..", "prompts", effectiveCategory);
        
        // Resolve the full path to the current prompt file
        if (currentPrompt.file.includes('/') || currentPrompt.file.includes('\\')) {
          // If it's a path, resolve it
          currentPromptFilePath = resolvePromptFilePath(currentPrompt.file, PROMPTS_FILE, categoryFolder);
        } else {
          // If it's just a filename, join with the category folder
          currentPromptFilePath = path.join(categoryFolder, currentPrompt.file);
        }
        
        log.info(`Existing prompt found. Current file: ${currentPromptFilePath}, will be updated to: ${fullPromptFilePath}`);
        
        // If the file path changed, remove the old file
        if (currentPromptFilePath !== fullPromptFilePath) {
          try {
            await fs.unlink(currentPromptFilePath);
            log.info(`Removed old prompt file: ${currentPromptFilePath}`);
          } catch (error) {
            log.warn(`Could not remove old prompt file ${currentPromptFilePath}:`, error);
            // Continue even if file deletion fails
          }
        }
      }
      
      // Create the prompt directory if it doesn't exist
      const promptDirPath = path.join(__dirname, "..", "prompts", effectiveCategory);
      try {
        await fs.mkdir(promptDirPath, { recursive: true });
      } catch (error) {
        log.error(`Error creating directory ${promptDirPath}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to create directory for category '${args.category}'.`
            }
          ],
          isError: true
        };
      }
      
      // Create the prompt file content
      let promptFileContent = `# ${args.name}\n\n`;
      promptFileContent += `## Description\n${args.description}\n\n`;
      
      if (args.systemMessage) {
        promptFileContent += `## System Message\n${args.systemMessage}\n\n`;
      }
      
      promptFileContent += `## User Message Template\n${args.userMessageTemplate}\n`;
      
      // Add chain steps if this is a chain prompt
      if (args.isChain && args.chainSteps && args.chainSteps.length > 0) {
        promptFileContent += `\n## Chain Steps\n\n`;
        
        const totalSteps = args.chainSteps.length;
        args.chainSteps.forEach((step: any, index: number) => {
          promptFileContent += `${index + 1}. promptId: ${step.promptId}\n`;
          promptFileContent += `   stepName: ${step.stepName} (Step ${index + 1} of ${totalSteps})\n`;
          
          if (step.inputMapping) {
            promptFileContent += `   inputMapping:\n`;
            for (const [key, value] of Object.entries(step.inputMapping)) {
              promptFileContent += `     ${key}: ${value}\n`;
            }
          }
          
          if (step.outputMapping) {
            promptFileContent += `   outputMapping:\n`;
            for (const [key, value] of Object.entries(step.outputMapping)) {
              promptFileContent += `     ${key}: ${value}\n`;
            }
          }
          
          promptFileContent += `\n`;
        });
        
        // Add Output Format section for chain prompts
        promptFileContent += `## Output Format\n\n`;
        promptFileContent += `After completing all ${totalSteps} steps in the chain, you will have a final output that:\n\n`;
        promptFileContent += `1. Is well-organized and clearly structured\n`;
        promptFileContent += `2. Represents the culmination of the entire chain process\n\n`;
        promptFileContent += `The final output will be the result of the last step in the chain.\n`;
      }
      
      // Write the prompt file
      try {
        await safeWriteFile(fullPromptFilePath, promptFileContent, "utf8");
        log.info(`Created prompt file: ${fullPromptFilePath}`);
      } catch (error) {
        log.error(`Error writing prompt file ${fullPromptFilePath}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to create prompt file.`
            }
          ],
          isError: true
        };
      }
      
      // Create a prompt entry for the category-specific prompts.json
      const categoryPromptEntry: PromptData = {
        id: args.id,
        name: args.name,
        category: effectiveCategory,
        description: args.description,
        file: promptFilename, // Just the filename within the category folder
        arguments: args.arguments
      };
      
      // Update or add the prompt to the category file
      if (promptExists) {
        categoryPrompts.prompts[existingPromptIndex] = categoryPromptEntry;
      } else {
        categoryPrompts.prompts.push(categoryPromptEntry);
      }
      
      // Define operations for the transaction
      const operations = [
        // 1. Write the updated category prompts file
        async () => {
          await safeWriteFile(categoryPromptsPath, JSON.stringify(categoryPrompts, null, 2), "utf8");
          log.info(`Updated category prompts file: ${categoryPromptsPath}`);
          return true;
        },
        
        // 2. Write the updated main config file (only if we added a new category)
        async () => {
          if (!categoryExists) {
            // Only update the main config if we added a new category
            await safeWriteFile(PROMPTS_FILE, JSON.stringify(promptsConfig, null, 2), "utf8");
            log.info(`Updated main promptsConfig.json with new category: ${effectiveCategory}`);
          }
          return true;
        }
      ];
      
      const rollbacks = [
        // 1. Restore the original category prompts file
        async () => {
          if (promptExists) {
            // If the prompt existed, we need to restore the original entry
            const originalCategoryPromptsContent = await readFile(categoryPromptsPath, "utf8");
            const originalCategoryPrompts = JSON.parse(originalCategoryPromptsContent);
            await fs.writeFile(categoryPromptsPath, JSON.stringify(originalCategoryPrompts, null, 2), "utf8");
          } else {
            // If it's a new prompt, we can just remove it from the array
            const updatedPrompts = categoryPrompts.prompts.filter(p => p.id !== args.id);
            await fs.writeFile(categoryPromptsPath, JSON.stringify({ prompts: updatedPrompts }, null, 2), "utf8");
          }
        },
        
        // 2. Restore the original main config file
        async () => {
          if (!categoryExists) {
            await fs.writeFile(PROMPTS_FILE, fileContent, "utf8");
          }
        }
      ];
      
      // Perform the operations as a transaction
      try {
        await performTransactionalFileOperations(operations, rollbacks);
        
        // Make a request to the reload_prompts API endpoint
        try {
          await triggerServerRefresh();
          log.info(`Triggered server refresh after updating prompt: ${args.id}`);
        } catch (refreshError) {
          log.error(`Error refreshing server after updating prompt: ${args.id}`, refreshError);
          // Continue even if refresh fails
        }
        
        // In the update_prompt function, replace the _meta section with a direct call to handleServerRestart
        if (args.restartServer) {
          log.info(`Restart server option selected for prompt: ${args.id}`);
          
          // Schedule the refresh with restart to happen after the response is sent
          setTimeout(async () => {
            try {
              await triggerServerRefresh(true, `Prompt updated: ${args.id}`);
            } catch (error) {
              log.error(`Error refreshing server after updating prompt: ${args.id}`, error);
            }
          }, 1000);
          
          // Return a response that includes information about the restart
          return {
            content: [
              {
                type: "text" as const,
                text: `Successfully ${promptExists ? 'updated' : 'created'} prompt: ${args.id}\nPrompt file created at: ${promptFilePath}\n\nRestarting server as requested...`
              }
            ]
          };
        } else {
          // Return the normal response
          return {
            content: [
              {
                type: "text" as const,
                text: `Successfully ${promptExists ? 'updated' : 'created'} prompt: ${args.id}\nPrompt file created at: ${promptFilePath}\n\nIf you need to use this prompt immediately, you may need to restart the server with the restart_server tool.`
              }
            ]
          };
        }
      } catch (error) {
        log.error(`Error updating prompt:`, error);
      return {
        content: [
          {
            type: "text",
              text: `Failed to update prompt: ${error instanceof Error ? error.message : String(error)}`
          }
          ],
          isError: true
      };
      }
    } catch (error) {
      log.error(`Error in update_prompt:`, error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to update prompt: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register the delete_prompt tool
server.tool(
  "delete_prompt",
  {
    id: z.string().describe("Unique identifier for the prompt to delete"),
    restartServer: z.boolean().optional().describe("Whether to restart the server after deleting the prompt")
  },
  async ({ id, restartServer }, extra) => {
    try {
      log.info(`Deleting prompt: ${id}`);
      
      // Read the main prompts configuration file
      const PROMPTS_FILE = path.join(__dirname, "..", config.prompts.file);
      
      try {
        // Try to load all prompts from all categories first
        const loadResult = await loadCategoryPrompts(PROMPTS_FILE);
        const allPrompts = loadResult.promptsData;
        
        // Find the prompt to delete from all loaded prompts
        const promptToDelete = allPrompts.find(p => p.id === id);
        
        if (!promptToDelete) {
        return {
          content: [
            {
              type: "text",
                text: `Prompt with ID '${id}' not found in any category`
            }
          ],
          isError: true
        };
      }
      
        // Step 1: Delete the markdown file using our new utility
        const promptsDir = path.join(__dirname, "..", "prompts");
        const fileResult = await findAndDeletePromptFile(id, promptsDir);
        
        if (fileResult.found) {
          if (fileResult.deleted) {
            log.info(`Successfully deleted markdown file for prompt '${id}'`);
          } else {
            log.error(`Found but could not delete markdown file: ${fileResult.error}`);
          }
        } else {
          log.warn(`Could not find markdown file for prompt '${id}'`);
        }
        
        // Step 2: Update the category-specific prompts.json file
        
        // Find the category-specific prompts.json file
        const categoryFolder = path.join(__dirname, "..", "prompts", promptToDelete.category);
        const categoryPromptsPath = path.join(categoryFolder, "prompts.json");
        
        // Read the category prompts file
        let categoryPrompts: { prompts: PromptData[] };
        try {
          const categoryPromptsContent = await readFile(categoryPromptsPath, "utf8");
          categoryPrompts = JSON.parse(categoryPromptsContent);
          
          // Ensure it has a prompts array
          if (!categoryPrompts.prompts) {
            log.warn(`Category prompts file ${categoryPromptsPath} does not have a 'prompts' array.`);
            categoryPrompts.prompts = [];
          }
        } catch (error) {
          log.error(`Error reading category prompts file ${categoryPromptsPath}:`, error);
          return {
            content: [
              {
                type: "text",
                text: `Could not read category prompts file for category '${promptToDelete.category}'`
              }
            ],
            isError: true
          };
        }
        
        // Find the prompt in the category file
        const promptIndex = categoryPrompts.prompts.findIndex(p => p.id === id);
        
        if (promptIndex === -1) {
          log.warn(`Prompt with ID '${id}' not found in category file ${categoryPromptsPath}`);
          // Continue with process even if prompt not found in category file
        }
        
        // Create updated category prompts without the prompt to delete
        const updatedCategoryPrompts = {
          ...categoryPrompts,
          prompts: categoryPrompts.prompts.filter(p => p.id !== id)
        };
        
        // Make a backup of the category file content
        const originalCategoryContent = JSON.stringify(categoryPrompts, null, 2);
        
        // Define operations for transactional file operations
        const operations = [
          // Update the category prompts file
          async () => {
            await safeWriteFile(categoryPromptsPath, JSON.stringify(updatedCategoryPrompts, null, 2), "utf8");
            log.info(`Updated category prompts file: ${categoryPromptsPath}`);
            return true;
          }
        ];
        
        // Define rollback operations
        const rollbacks = [
          // Restore the original category file
          async () => {
            await fs.writeFile(categoryPromptsPath, originalCategoryContent, "utf8");
            log.info(`Restored original category prompts file: ${categoryPromptsPath}`);
          }
        ];
        
        // Perform the operations as a transaction
        await performTransactionalFileOperations(operations, rollbacks);
        
        // Make a request to the reload_prompts API endpoint
        try {
          await triggerServerRefresh();
          log.info(`Triggered server refresh after deleting prompt: ${id}`);
        } catch (refreshError) {
          log.error(`Error refreshing server after deleting prompt: ${id}`, refreshError);
          // Continue even if refresh fails
      }
      
      // In the delete_prompt function, replace the _meta section with a direct call to handleServerRestart
      if (restartServer) {
        log.info(`Restart server option selected for prompt: ${id}`);
        
        // Schedule the refresh with restart to happen after the response is sent
        setTimeout(async () => {
          try {
            await triggerServerRefresh(true, `Prompt deleted: ${id}`);
          } catch (error) {
            log.error(`Error refreshing server after deleting prompt: ${id}`, error);
          }
        }, 1000);
        
        // Return a response that includes information about the restart
        return {
          content: [
            {
              type: "text" as const,
              text: `Prompt '${promptToDelete.name}' (ID: ${id}) deleted successfully${fileResult.deleted ? ' including its markdown file' : ''}\n\nRestarting server as requested...`
            }
          ]
        };
      } else {
        // Return the normal response
        return {
          content: [
            {
              type: "text" as const,
              text: `Prompt '${promptToDelete.name}' (ID: ${id}) deleted successfully${fileResult.deleted ? ' including its markdown file' : ''}\n\nIf you need this change to take effect immediately, you may need to restart the server with the restart_server tool.`
            }
          ]
        };
      }
    } catch (error) {
        log.error("Error in delete_prompt tool:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to delete prompt: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  } catch (outerError) {
      log.error("Error in delete_prompt outer try block:", outerError);
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to delete prompt: ${outerError instanceof Error ? outerError.message : String(outerError)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Register the modify_prompt_section tool
server.tool(
  "modify_prompt_section",
  {
    id: z.string().describe("Unique identifier of the prompt to modify"),
    section_name: z.string().describe("Name of the section to modify (valid values: 'title', 'description', 'System Message', 'User Message Template', or any custom section)"),
    new_content: z.string().describe("New content for the specified section"),
    restartServer: z.boolean().optional().describe("Whether to restart the server after modifying the prompt section")
  },
  async (args) => {
    try {
      log.info(`Attempting to modify section '${args.section_name}' of prompt '${args.id}'`);
      
      // Read the current prompts.json file
      const PROMPTS_FILE = path.join(__dirname, "..", config.prompts.file);
      
      try {
        // Use the modifyPromptSection function from promptUtils
        const result = await modifyPromptSection(
          args.id,
          args.section_name,
          args.new_content,
          PROMPTS_FILE
        );
        
        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: result.message
              }
            ],
            isError: true
          };
        }
        
        // Make a request to the reload_prompts API endpoint with restart option if specified
        try {
          await triggerServerRefresh(args.restartServer || false, `Section modified: ${args.section_name} in prompt: ${args.id}`);
          log.info(`Triggered server refresh${args.restartServer ? ' with restart' : ''} after modifying section: ${args.section_name}`);
        } catch (refreshError) {
          log.error(`Error refreshing server after modifying section: ${args.section_name}`, refreshError);
          // Continue even if refresh fails
        }
        
        // If restart is requested, provide appropriate response
        if (args.restartServer) {
          return {
            content: [
              {
                type: "text" as const,
                text: `${result.message}\n\nRestarting server as requested...`
              }
            ]
          };
        }
        
        // Normal response without restart
        return {
          content: [
            {
              type: "text" as const,
              text: `${result.message}\n\nIf you need this change to take effect immediately, you may need to restart the server with the reload_prompts tool.`
            }
          ]
        };
      } catch (error) {
        log.error(`Error modifying prompt section:`, error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to modify prompt section: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    } catch (error) {
      log.error(`Error in modify_prompt_section:`, error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to modify prompt section: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// New function to reload prompts without restarting the server
async function reloadPrompts(): Promise<{ promptsData: PromptData[]; convertedPrompts: ConvertedPrompt[] }> {
  try {
    log.info(`Reloading prompts from ${PROMPTS_FILE}...`);
    
    // Clear cache before reloading
    clearRequireCache();
    
    // Clear any server-side caches that might exist
    if (typeof (server as any).clearCache === 'function') {
      try {
        (server as any).clearCache();
        log.info("Cleared server-side prompt cache");
      } catch (cacheClearError) {
        log.warn("Could not clear server-side cache:", cacheClearError);
      }
    }
    
    // Load prompts from category-specific files
    let result;
    try {
      result = await loadCategoryPrompts(PROMPTS_FILE);
    } catch (loadError) {
      log.error(`Error loading category prompts:`, loadError);
      throw new Error(`Failed to load category prompts: ${loadError instanceof Error ? loadError.message : String(loadError)}`);
    }
    
    // Verify the loaded data
    if (!result || !result.promptsData || !Array.isArray(result.promptsData)) {
      log.error(`Invalid data returned from loadCategoryPrompts: ${JSON.stringify(result)}`);
      throw new Error(`Failed to load category prompts: Invalid data structure returned`);
    }
    
    // Log the loaded prompts for debugging
    log.info(`Loaded ${result.promptsData.length} prompts from categories`);
    
    // Update the global variables
    promptsData = result.promptsData;
    categories = result.categories;
    
    // Re-convert markdown prompts to JSON
    let newConvertedPrompts;
    try {
      newConvertedPrompts = await convertMarkdownPromptsToJson(promptsData);
    } catch (convertError) {
      log.error(`Error converting markdown prompts to JSON:`, convertError);
      throw new Error(`Failed to convert markdown prompts to JSON: ${convertError instanceof Error ? convertError.message : String(convertError)}`);
    }
    
    // Verify the conversion results
    if (!newConvertedPrompts || !Array.isArray(newConvertedPrompts)) {
      log.error(`Invalid data returned from convertMarkdownPromptsToJson`);
      throw new Error(`Failed to convert markdown prompts to JSON: Invalid data structure returned`);
    }
    
    // Update the global convertedPrompts array
    // Use a transaction-like approach for updating the global array
    const oldConvertedPrompts = [...convertedPrompts];
    try {
      // Clear the array
      convertedPrompts.length = 0;
      // Add all new prompts
      newConvertedPrompts.forEach(prompt => convertedPrompts.push(prompt));
      
      // Log detailed information about what's been loaded
      const categoriesSet = new Set(newConvertedPrompts.map(p => p.category));
      log.info(`Loaded prompts from ${categoriesSet.size} categories: ${Array.from(categoriesSet).join(', ')}`);
      
      // Verify each prompt has been properly loaded
      const incompletePrompts = newConvertedPrompts.filter(p => 
        !p.id || !p.name || !p.userMessageTemplate || !p.arguments
      );
      
      if (incompletePrompts.length > 0) {
        log.warn(`Found ${incompletePrompts.length} incomplete prompts:`, 
          incompletePrompts.map(p => p.id || 'unknown').join(', ')
        );
      }
      
      // Re-register all prompts with the server
      await reRegisterAllPrompts(newConvertedPrompts);
      
    } catch (updateError) {
      log.error(`Error updating global convertedPrompts array:`, updateError);
      // Restore the old array if there's an error
      convertedPrompts.length = 0;
      oldConvertedPrompts.forEach(prompt => convertedPrompts.push(prompt));
      throw new Error(`Failed to update global convertedPrompts array: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
    }
    
    log.info(`Successfully reloaded ${promptsData.length} prompts and ${categories.length} categories`);
    log.info(`Successfully converted ${newConvertedPrompts.length} prompts to JSON structure`);
    
    return { promptsData, convertedPrompts: newConvertedPrompts };
      } catch (error) {
    log.error(`Error in reloadPrompts:`, error);
    throw error;
  }
}

// Function to re-register all prompts with the server
async function reRegisterAllPrompts(prompts: ConvertedPrompt[]): Promise<void> {
  try {
    log.info(`Re-registering ${prompts.length} prompts with the server...`);
    
    // Unregister existing prompts if possible
    if (typeof (server as any).unregisterAllPrompts === 'function') {
      try {
        (server as any).unregisterAllPrompts();
        log.info("Unregistered all existing prompts");
      } catch (unregisterError) {
        log.warn("Could not unregister existing prompts:", unregisterError);
      }
    }
    
    // Set a default registration mode if not specified in config
    const registrationMode = config.prompts.registrationMode || "both";
    
    // Register each prompt from the converted JSON structures
    let registeredCount = 0;
    for (const promptData of prompts) {
      try {
        // Create the argument schema for this prompt
        const argsSchema = createArgsSchema(promptData.arguments);
        
        // Create the prompt handler
        const promptHandler = async (args: any, extra: any) => {
          try {
            log.info(`Executing prompt '${promptData.name}'...`);
            
            // Check if this is a chain prompt
            if (promptData.isChain && promptData.chainSteps && promptData.chainSteps.length > 0) {
              log.info(`Prompt '${promptData.name}' is a chain with ${promptData.chainSteps.length} steps. NOT automatically executing the chain.`);
              
              // No longer automatically execute the entire chain
              // Instead, we'll process this as a regular prompt
              
              // Regular prompt processing continues below
            }
            
            // Regular (non-chain) prompt processing continues below
            // Create messages array with only user and assistant roles
            // System messages will be converted to user messages
            const messages: { role: "user" | "assistant"; content: { type: "text"; text: string } }[] = [];
            
            // Create user message with placeholders replaced
            let userMessageText = promptData.userMessageTemplate;
            
            // If there's a system message, prepend it to the user message
            if (promptData.systemMessage) {
              userMessageText = `[System Info: ${promptData.systemMessage}]\n\n${userMessageText}`;
            }
            
            // Process special context placeholders first
            const specialPlaceholders = {
              "previous_message": getPreviousMessage()
            };
            
            // Replace special placeholders
            Object.entries(specialPlaceholders).forEach(([key, value]) => {
              userMessageText = userMessageText.replace(
                new RegExp(`\\{\\{${key}\\}\\}`, "g"),
                String(value)
              );
            });
            
            // Replace argument placeholders
            Object.entries(args).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                const replaced = userMessageText.replace(
                  new RegExp(`\\{\\{${key}\\}\\}`, "g"),
                  String(value)
                );
                if (replaced === userMessageText) {
                  log.warn(`Placeholder for argument '${key}' not found in template for prompt '${promptData.name}'`);
                }
                userMessageText = replaced;
              }
            });
            
            // Store in conversation history for future reference
            addToConversationHistory({
              role: "user",
              content: userMessageText,
              timestamp: Date.now(),
              isProcessedTemplate: true  // Mark as a processed template, not original user input
            });
            
            // Push the user message to the messages array
            messages.push({
              role: "user",
              content: {
                type: "text",
                text: userMessageText
              }
            });
            
            log.debug(`Processed messages for prompt '${promptData.name}':`, messages);
            return { messages };
          } catch (error) {
            log.error(`Error executing prompt '${promptData.name}':`, error);
            throw error; // Re-throw to let the MCP framework handle it
          }
        };
        
        // Register the prompt based on the configuration mode
        if (registrationMode === "id" || registrationMode === "both") {
          server.prompt(promptData.id, argsSchema, promptHandler);
          log.debug(`Registered prompt with ID: ${promptData.id}`);
        }
        
        if (registrationMode === "name" || registrationMode === "both") {
          server.prompt(promptData.name, argsSchema, promptHandler);
          log.debug(`Registered prompt with name: ${promptData.name}`);
        }
        
        registeredCount++;
  } catch (error) {
        log.error(`Error registering prompt '${promptData.name}':`, error);
        // Continue with other prompts even if one fails
      }
    }
    
    log.info(`Successfully re-registered ${registeredCount} prompts with the server`);
  } catch (error) {
    log.error(`Error re-registering prompts:`, error);
    throw error;
  }
}

// Helper function to create argument schema for a prompt
function createArgsSchema(promptArgs: Array<{ name: string; description?: string; required: boolean }>): any {
  const schema: any = {};
  
  for (const arg of promptArgs) {
    schema[arg.name] = {
      type: "string",
      description: arg.description || `Argument: ${arg.name}`,
      required: arg.required
    };
  }
  
  return schema;
}

// Convert markdown prompts to JSON structure
const convertedPrompts = await convertMarkdownPromptsToJson(promptsData);

// Set a default registration mode if not specified in config
const registrationMode = config.prompts.registrationMode || "both";
log.info(`Using prompt registration mode: ${registrationMode}`);

// Register each prompt from the converted JSON structures
for (const promptData of convertedPrompts) {
  try {
    // Create a schema for the prompt arguments - treat all as optional
    const argsSchema: Record<string, z.ZodType> = {};
    promptData.arguments.forEach(arg => {
      // All arguments are treated as optional strings regardless of required flag
      argsSchema[arg.name] = z.string().optional();
    });

    // Create prompt handler function
    const promptHandler = async (args: any) => {
      try {
        log.debug(`Executing prompt '${promptData.name}' with args:`, args);
        
        // Ensure all defined arguments have values (using previous_message as fallback)
        promptData.arguments.forEach(arg => {
          if (!args[arg.name]) {
            args[arg.name] = `{{previous_message}}`;
          }
        });
        
        // Check if this is a chain prompt
        if (promptData.isChain && promptData.chainSteps && promptData.chainSteps.length > 0) {
          log.info(`Prompt '${promptData.name}' is a chain with ${promptData.chainSteps.length} steps. NOT automatically executing the chain.`);
          
          // No longer automatically execute the entire chain
          // Instead, we'll process this as a regular prompt
          
          // Regular prompt processing continues below
        }
        
        // Regular (non-chain) prompt processing continues below
        // Create messages array with only user and assistant roles
        // System messages will be converted to user messages
        const messages: { role: "user" | "assistant"; content: { type: "text"; text: string } }[] = [];
        
        // Create user message with placeholders replaced
        let userMessageText = promptData.userMessageTemplate;
        
        // If there's a system message, prepend it to the user message
        if (promptData.systemMessage) {
          userMessageText = `[System Info: ${promptData.systemMessage}]\n\n${userMessageText}`;
        }
        
        // Process special context placeholders first
        const specialPlaceholders = {
          "previous_message": getPreviousMessage()
        };
        
        // Replace special placeholders
        Object.entries(specialPlaceholders).forEach(([key, value]) => {
          userMessageText = userMessageText.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, "g"),
            String(value)
          );
        });
        
        // Replace argument placeholders
        Object.entries(args).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const replaced = userMessageText.replace(
              new RegExp(`\\{\\{${key}\\}\\}`, "g"),
              String(value)
            );
            if (replaced === userMessageText) {
              log.warn(`Placeholder for argument '${key}' not found in template for prompt '${promptData.name}'`);
            }
            userMessageText = replaced;
          }
        });
        
        // Store in conversation history for future reference
        addToConversationHistory({
          role: "user",
          content: userMessageText,
          timestamp: Date.now(),
          isProcessedTemplate: true  // Mark as a processed template, not original user input
        });
        
        // Push the user message to the messages array
        messages.push({
          role: "user",
          content: {
            type: "text",
            text: userMessageText
          }
        });
        
        log.debug(`Processed messages for prompt '${promptData.name}':`, messages);
        return { messages };
      } catch (error) {
        log.error(`Error executing prompt '${promptData.name}':`, error);
        throw error; // Re-throw to let the MCP framework handle it
      }
    };

    // Register the prompt based on the configuration mode
    if (registrationMode === "id" || registrationMode === "both") {
      server.prompt(promptData.id, argsSchema, promptHandler);
      log.info(`Registered prompt with ID: ${promptData.id}`);
    }
    
    if ((registrationMode === "name" || registrationMode === "both") && promptData.name !== promptData.id) {
      try {
        server.prompt(promptData.name, argsSchema, promptHandler);
        log.info(`Registered prompt with display name: ${promptData.name}`);
      } catch (error) {
        log.debug(`Could not register display name, might conflict with another identifier: ${promptData.name}`);
      }
    }
  } catch (error) {
    log.error(`Error registering prompt ${promptData.id}:`, error);
  }
}

// Start the server with the appropriate transport
if (transport === "stdio") {
  // Use STDIO transport
  log.info("Starting server with STDIO transport");
  
  // Create and configure the STDIO transport
  const stdioTransport = new StdioServerTransport();
  
  // Ensure we don't mix log messages with JSON messages
  // Redirect console.log/error for the rest of the process
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  console.log = (...args) => {
    logToFile('CONSOLE', args.join(' '));
  };
  
  console.error = (...args) => {
    logToFile('CONSOLE_ERROR', args.join(' '));
  };
  
  // Log when the stdin closes (which happens when the parent process terminates)
  process.stdin.on('end', () => {
    logToFile('INFO', 'STDIN stream ended - parent process may have terminated');
    process.exit(0);
  });
  
  // Connect the server to the transport
  try {
    await server.connect(stdioTransport);
    logToFile('INFO', "STDIO transport connected successfully");
  } catch (error) {
    logToFile('ERROR', "Error connecting to STDIO transport:", error);
    process.exit(1);
  }
} else {
  // Use SSE transport with Express
  const app = express();
  const sseTransports = new Map<string, SSEServerTransport>();
  
  // Enable CORS for Cursor integration
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Add JSON body parser middleware
  app.use(express.json());
  
  // Add request logging middleware
  app.use((req, res, next) => {
    log.debug(`${req.method} ${req.url} - Headers: ${JSON.stringify(req.headers)}`);
    next();
  });
  
  
  app.get("/", (_req: Request, res: Response) => {
    res.send("Claude Custom Prompts MCP Server - Use /mcp endpoint for MCP connections");
  });
  
  // Add a simple health check endpoint for Cursor
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", version: config.server.version });
  });
  
  app.get("/mcp", async (req: Request, res: Response) => {
    log.info("New SSE connection from " + req.ip);
    
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // listpromptss with certain proxies
    
    // Create a unique ID for this connection
    const connectionId = Date.now().toString();
    
    // Create a new transport for this connection
    const sseTransport = new SSEServerTransport("/messages", res);
    sseTransports.set(connectionId, sseTransport);
    
    // Log connection data for debugging
    log.debug("Connection headers:", req.headers);
    
    // Remove the transport when the connection is closed
    res.on("close", () => {
      log.info(`SSE connection ${connectionId} closed`);
      sseTransports.delete(connectionId);
    });
    
    try {
      await server.connect(sseTransport);
      log.info(`SSE transport ${connectionId} connected successfully`);
    } catch (error) {
      log.error("Error connecting to SSE transport:", error);
      sseTransports.delete(connectionId);
      res.status(500).end();
    }
  });
  
  app.post("/messages", express.json(), async (req: Request, res: Response) => {
    log.debug("Received message:", req.body);
    
    try {
      // Try to handle the request with each transport
      const transports = Array.from(sseTransports.values());
      
      if (transports.length === 0) {
        log.error("No active SSE connections found");
        return res.status(503).json({ error: "No active SSE connections" });
      }
      
      let handled = false;
      let lastError = null;
      
      for (const transport of transports) {
        try {
          // Use any available method to process the request
          // This is a workaround for TypeScript errors
          const sseTransport = transport as any;
          
          if (typeof sseTransport.handleRequest === 'function') {
            log.debug("Using handleRequest method");
            handled = await sseTransport.handleRequest(req, res);
          } else if (typeof sseTransport.processRequest === 'function') {
            log.debug("Using processRequest method");
            handled = await sseTransport.processRequest(req, res);
          }
          
          if (handled) {
            log.debug("Request handled successfully");
            break;
          }
        } catch (e) {
          lastError = e;
          log.error("Error processing request with transport:", e);
        }
      }
      
      if (!handled) {
        log.error("No transport handled the request");
        if (lastError) {
          log.error("Last error:", lastError);
        }
        res.status(404).json({ error: "No matching transport found" });
      }
    } catch (error) {
      log.error("Error handling message:", error);
      res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Add endpoint to get categories and prompts
  app.get("/prompts", (_req: Request, res: Response) => {
    const result = {
      categories,
      prompts: promptsData.map(prompt => ({
        id: prompt.id,
        name: prompt.name,
        category: prompt.category,
        description: prompt.description,
        arguments: prompt.arguments
      }))
    };
    res.json(result);
  });
  
  // Add endpoint to get prompts by category
  app.get("/categories/:categoryId/prompts", (req: Request, res: Response) => {
    const categoryId = req.params.categoryId;
    const categoryPrompts = promptsData.filter(prompt => prompt.category === categoryId);
    
    if (categoryPrompts.length === 0) {
      return res.status(404).json({ error: `No prompts found for category: ${categoryId}` });
    }
    
    res.json(categoryPrompts);
  });
  
  // Add API endpoints for tools
  app.post("/api/v1/tools/create_category", async (req: Request, res: Response) => {
    try {
      log.info("API request to create category:", req.body);
      
      // Validate required fields
      if (!req.body.id || !req.body.name || !req.body.description) {
        return res.status(400).json({ 
          error: "Missing required fields. Please provide id, name, and description." 
        });
      }
      
      // Implement the create_category functionality directly
      try {
        const { id, name, description } = req.body;
        
        // Read the current prompts.json file
        const PROMPTS_FILE = path.join(__dirname, "..", config.prompts.file);
        const fileContent = await readFile(PROMPTS_FILE, "utf8");
        const promptsFile = JSON.parse(fileContent) as PromptsFile;
        
        // Check if the category already exists
        const categoryExists = promptsFile.categories.some(cat => cat.id === id);
        if (categoryExists) {
          return res.status(400).json({ error: `Category '${id}' already exists.` });
        }
        
        // Add the new category
        promptsFile.categories.push({ id, name, description });
        
        // Write the updated file
        await writeFile(PROMPTS_FILE, JSON.stringify(promptsFile, null, 2), "utf8");
        
        // Create the category directory if it doesn't exist
        const categoryDirPath = path.join(__dirname, "..", "prompts", id);
        try {
          await fs.mkdir(categoryDirPath, { recursive: true });
        } catch (error) {
          log.error(`Error creating directory ${categoryDirPath}:`, error);
          // Continue even if directory creation fails
        }
        
        // Reload prompts and categories
        try {
          const result = await reloadPrompts();
          log.info(`Reloaded ${promptsData.length} prompts and ${categories.length} categories after creating category: ${id}`);
        } catch (error) {
          log.error("Error reloading prompts data:", error);
          // Continue even if reload fails
        }
        
        // Return success response
        return res.status(200).json({ 
          success: true, 
          message: `Category '${name}' created successfully` 
        });
      } catch (toolError) {
        return res.status(400).json({ error: toolError instanceof Error ? toolError.message : String(toolError) });
      }
    } catch (error) {
      log.error("Error handling create_category API request:", error);
      return res.status(500).json({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  app.post("/api/v1/tools/update_prompt", async (req: Request, res: Response) => {
    try {
      log.info("API request to update prompt:", req.body);
      
      // Validate required fields
      if (!req.body.id || !req.body.name || !req.body.category || !req.body.userMessageTemplate) {
        return res.status(400).json({ 
          error: "Missing required fields. Please provide id, name, category, and userMessageTemplate." 
        });
      }
      
      // Implement the update_prompt functionality directly
      try {
        const { id, name, category, description, userMessageTemplate, arguments: promptArgs, systemMessage, isChain, chainSteps } = req.body;
        
        try {
          // Read the prompts.json file to check for existing categories
          const PROMPTS_FILE = path.join(__dirname, "..", config.prompts.file);
          const promptsFile = JSON.parse(await readFile(PROMPTS_FILE, "utf8"));
          const categoryExists = promptsFile.categories.some((cat: { id: string }) => cat.id === category);
          let effectiveCategory = category; // Define this variable outside the if block
          
          // If the category doesn't exist, create it
          if (!categoryExists) {
            log.info(`Category '${category}' does not exist. Creating it automatically.`);
            
            // Generate a clean category ID
            const categoryId = category.toLowerCase().replace(/\s+/g, "-");
            const categoryName = category; // Use original name for display
            const categoryDescription = `Prompts related to ${category}`;
            
            // Add the new category to the prompts file
            promptsFile.categories.push({ 
              id: categoryId, 
              name: categoryName, 
              description: categoryDescription 
            });
            
            // Create the category directory
            const categoryDirPath = path.join(__dirname, "..", "prompts", categoryId);
            try {
              await fs.mkdir(categoryDirPath, { recursive: true });
              log.info(`Created directory for new category: ${categoryDirPath}`);
            } catch (error) {
              log.error(`Error creating directory ${categoryDirPath}:`, error);
              // Continue even if directory creation fails
            }
            
            // Update the effective category to use the cleaned ID
            effectiveCategory = categoryId;
            log.info(`Created new category: '${category}' with ID: '${categoryId}'`);
          }
          
          // Create the directory structure
          const promptsDir = path.join(__dirname, "..", "prompts", effectiveCategory);
          await fs.mkdir(promptsDir, { recursive: true });
          
          // Create the prompt data object
          const promptData = {
            id,
            name,
            category: effectiveCategory,
            description,
            file: `prompts/${effectiveCategory}/${id}.md`,
            arguments: promptArgs || []
          };
          
          // Check if the prompt already exists
          const existingPromptIndex = promptsFile.prompts.findIndex((p: { id: string }) => p.id === id);
          const promptExists = existingPromptIndex !== -1;
          
          // Construct the prompt file content
          let promptFileContent = `# ${name}\n\n`;
          promptFileContent += `${description}\n\n`;
          
          if (systemMessage) {
            promptFileContent += `## System Message\n\n${systemMessage}\n\n`;
          }
          
          promptFileContent += `## User Message Template\n\n${userMessageTemplate}\n\n`;
          
          if (isChain && chainSteps && chainSteps.length > 0) {
            promptFileContent += `\n## Chain Steps\n\n`;
            
            const totalSteps = chainSteps.length;
            chainSteps.forEach((step: any, index: number) => {
              promptFileContent += `${index + 1}. promptId: ${step.promptId}\n`;
              promptFileContent += `   stepName: ${step.stepName} (Step ${index + 1} of ${totalSteps})\n`;
              
              if (step.inputMapping) {
                promptFileContent += `   inputMapping:\n`;
                for (const [key, value] of Object.entries(step.inputMapping)) {
                  promptFileContent += `     ${key}: ${value}\n`;
                }
              }
              
              if (step.outputMapping) {
                promptFileContent += `   outputMapping:\n`;
                for (const [key, value] of Object.entries(step.outputMapping)) {
                  promptFileContent += `     ${key}: ${value}\n`;
                }
              }
              
              promptFileContent += `\n`;
            });
            
            // Add Output Format section for chain prompts
            promptFileContent += `## Output Format\n\n`;
            promptFileContent += `After completing all ${totalSteps} steps in the chain, you will have a final output that:\n\n`;
            promptFileContent += `1. Is well-organized and clearly structured\n`;
            promptFileContent += `2. Represents the culmination of the entire chain process\n\n`;
            promptFileContent += `The final output will be the result of the last step in the chain.\n`;
          }
          
          // Write the prompt file
          const promptFilePath = path.join(promptsDir, `${id}.md`);
          await writeFile(promptFilePath, promptFileContent, "utf8");
          
          // Create or update the prompt entry in prompts.json
          if (promptExists) {
            promptsFile.prompts[existingPromptIndex] = promptData;
          } else {
            promptsFile.prompts.push(promptData);
          }
          
          // Write the updated prompts.json file
          await writeFile(PROMPTS_FILE, JSON.stringify(promptsFile, null, 2), "utf8");
          
          // Make a request to the reload_prompts API endpoint
          try {
            await triggerServerRefresh();
            log.info(`Triggered server refresh after updating prompt: ${id}`);
          } catch (refreshError) {
            log.error(`Error refreshing server after updating prompt: ${id}`, refreshError);
            // Continue even if refresh fails
          }
          
          // Return success response
          return res.status(200).json({ 
            success: true, 
            message: `Prompt '${name}' ${promptExists ? 'updated' : 'created'} successfully` 
          });
        } catch (toolError) {
          return res.status(400).json({ error: toolError instanceof Error ? toolError.message : String(toolError) });
        }
      } catch (error) {
        log.error("Error handling update_prompt API request:", error);
        return res.status(500).json({ 
          error: "Internal server error", 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
    } catch (error) {
      log.error("Error handling update_prompt API request:", error);
      return res.status(500).json({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Add DELETE endpoint to delete a prompt
  app.delete("/api/v1/tools/prompts/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      log.info(`API request to delete prompt: ${id}`);
      
      if (!id) {
        return res.status(400).json({ error: "Prompt ID is required" });
      }
      
      try {
        // Read the current prompts.json file
        const PROMPTS_FILE = path.join(__dirname, "..", config.prompts.file);
        const fileContent = await readFile(PROMPTS_FILE, "utf8");
        const promptsFile = JSON.parse(fileContent) as PromptsFile;
        
        // Find the prompt to delete
        const promptIndex = promptsFile.prompts.findIndex(p => p.id === id);
        
        if (promptIndex === -1) {
          return res.status(404).json({ error: `Prompt with ID '${id}' not found` });
        }
        
        // Get the prompt data before removing it
        const promptToDelete = promptsFile.prompts[promptIndex];
        
        // Remove the prompt from the array
        promptsFile.prompts.splice(promptIndex, 1);
        
        // Write the updated prompts.json file
        await writeFile(PROMPTS_FILE, JSON.stringify(promptsFile, null, 2), "utf8");
        
        // Delete the prompt file if it exists
        try {
          const promptFilePath = path.join(__dirname, "..", promptToDelete.file);
          await fs.unlink(promptFilePath);
          log.info(`Deleted prompt file: ${promptFilePath}`);
        } catch (fileError) {
          log.warn(`Could not delete prompt file: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
          // Continue even if file deletion fails
        }
        
        // Make a request to the reload_prompts API endpoint
        try {
          await triggerServerRefresh();
          log.info(`Triggered server refresh after deleting prompt: ${id}`);
        } catch (refreshError) {
          log.error(`Error refreshing server after deleting prompt: ${id}`, refreshError);
          // Continue even if refresh fails
        }
        
        return res.status(200).json({ 
          success: true, 
          message: `Prompt '${promptToDelete.name}' (ID: ${id}) deleted successfully` 
        });
      } catch (toolError) {
        return res.status(400).json({ error: toolError instanceof Error ? toolError.message : String(toolError) });
      }
    } catch (error) {
      log.error("Error handling delete_prompt API request:", error);
      return res.status(500).json({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // API endpoint for modify_prompt_section
  app.post("/api/v1/tools/modify_prompt_section", async (req: Request, res: Response) => {
    try {
      log.info("Received request to modify prompt section:", req.body);
      
      const { id, section_name, new_content, restartServer } = req.body;
      
      if (!id || !section_name || !new_content) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: id, section_name, and new_content are required"
        });
      }
      
      // Read the current prompts.json file
      const PROMPTS_FILE = path.join(__dirname, "..", config.prompts.file);
      
      try {
        // Use the modifyPromptSection function from promptUtils
        const result = await modifyPromptSection(
          id,
          section_name,
          new_content,
          PROMPTS_FILE
        );
        
        if (!result.success) {
          return res.status(404).json({
            success: false,
            message: result.message
          });
        }
        
        // Make a request to the reload_prompts API endpoint with restart option if specified
        try {
          await triggerServerRefresh(restartServer || false, `Section modified: ${section_name} in prompt: ${id}`);
          log.info(`Triggered server refresh${restartServer ? ' with restart' : ''} after modifying section: ${section_name}`);
        } catch (refreshError) {
          log.error(`Error refreshing server after modifying section: ${section_name}`, refreshError);
          // Continue even if refresh fails
        }
        
        // If restart is requested, provide appropriate response
        if (restartServer) {
          return res.status(200).json({
            success: true,
            message: `${result}. Server is now restarting.`,
            restarting: true
          });
        }
        
        // Normal response without restart
        return res.status(200).json({
          success: true,
          message: result
        });
      } catch (error) {
        log.error(`Error in modify_prompt_section:`, error);
        return res.status(500).json({
          success: false,
          message: `Failed to modify prompt section: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    } catch (error) {
      log.error("Error handling modify_prompt_section API request:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Add API endpoint to reload prompts
  app.post("/api/v1/tools/reload_prompts", async (req: Request, res: Response) => {
    try {
      log.info("API request to reload prompts");
      
      // Check if restart is requested
      const shouldRestart = req.body && req.body.restart === true;
      const reason = req.body && req.body.reason ? req.body.reason : "Manual reload requested";
      
      try {
        // Use the fullServerRefresh function for a comprehensive refresh
        await fullServerRefresh();
        
        // If restart is requested, schedule it after sending the response
        if (shouldRestart) {
          log.info(`Server restart requested: ${reason}`);
          
          // Schedule the restart to happen after the response is sent
          setTimeout(async () => {
            try {
              await handleServerRestart(reason);
            } catch (restartError) {
              log.error("Error during server restart:", restartError);
            }
          }, 1000);
          
          return res.status(200).json({
            success: true,
            message: `Successfully refreshed the server with ${promptsData.length} prompts and ${categories.length} categories. Server is now restarting.`,
            data: {
              promptsCount: promptsData.length,
              categoriesCount: categories.length,
              convertedPromptsCount: convertedPrompts.length,
              restarting: true
            }
          });
        }
        
        // Normal response without restart
        return res.status(200).json({
          success: true,
          message: `Successfully refreshed the server with ${promptsData.length} prompts and ${categories.length} categories`,
          data: {
            promptsCount: promptsData.length,
            categoriesCount: categories.length,
            convertedPromptsCount: convertedPrompts.length
          }
        });
      } catch (refreshError) {
        log.error("Error refreshing server:", refreshError);
        return res.status(500).json({
          success: false,
          message: `Failed to refresh server: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`
        });
      }
    } catch (error) {
      log.error("Error handling reload_prompts API request:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  
  // Create server and handle errors
  const httpServer = app.listen(PORT, () => {
    log.info(`MCP Prompts Server running on http://localhost:${PORT}`);
    log.info(`Connect to http://localhost:${PORT}/mcp for MCP connections`);
  });
  
  httpServer.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      log.error(`Port ${PORT} is already in use. Please choose a different port or stop the other service.`);
    } else {
      log.error('Server error:', error);
    }
    process.exit(1);
  });
}

// Log system info for potential debugging
log.info(`Server process memory usage: ${JSON.stringify(process.memoryUsage())}`);

// Handle graceful shutdown
process.on("SIGINT", () => {
  log.info("Shutting down server...");
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Function to load prompts from category-specific prompts.json files
async function loadCategoryPrompts(configPath: string): Promise<{ promptsData: PromptData[]; categories: Category[] }> {
  try {
    // Read the promptsConfig.json file
    const configContent = await readFile(configPath, "utf8");
    let promptsConfig: PromptsConfigFile;
    
    try {
      promptsConfig = JSON.parse(configContent) as PromptsConfigFile;
    } catch (jsonError) {
      log.error(`Error parsing config file ${configPath}:`, jsonError);
      throw new Error(`Invalid JSON in config file: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }
    
    // Ensure required properties exist
    if (!promptsConfig.categories) {
      log.warn(`Config file ${configPath} does not have a 'categories' array. Initializing it.`);
      promptsConfig.categories = [];
    }
    
    if (!promptsConfig.imports || !Array.isArray(promptsConfig.imports)) {
      log.warn(`Config file ${configPath} does not have a valid 'imports' array. Initializing it.`);
      promptsConfig.imports = [];
    }
    
    // Get the categories from the config
    const categories = promptsConfig.categories;
    
    // Initialize an array to store all prompts
    let allPrompts: PromptData[] = [];
    
    // Load prompts from each import path
    for (const importPath of promptsConfig.imports) {
      try {
        // Construct the full path to the import file
        const fullImportPath = path.join(__dirname, "..", importPath);
        
        // Check if the file exists
        try {
          await fs.access(fullImportPath);
        } catch (error) {
          log.warn(`Import file not found: ${importPath}. Creating empty file.`);
          
          // Create the directory if it doesn't exist
          const dir = path.dirname(fullImportPath);
          await fs.mkdir(dir, { recursive: true });
          
          // Create an empty prompts file
          await safeWriteFile(fullImportPath, JSON.stringify({ prompts: [] }, null, 2), "utf8");
        }
        
        // Read the file
        const fileContent = await readFile(fullImportPath, "utf8");
        let categoryPromptsFile: any;
        
        try {
          categoryPromptsFile = JSON.parse(fileContent);
        } catch (jsonError) {
          log.error(`Error parsing import file ${importPath}:`, jsonError);
          log.info(`Creating empty prompts file for ${importPath} due to parsing error.`);
          categoryPromptsFile = { prompts: [] };
          await safeWriteFile(fullImportPath, JSON.stringify(categoryPromptsFile, null, 2), "utf8");
        }
        
        // Ensure prompts property exists and is an array
        if (!categoryPromptsFile.prompts) {
          log.warn(`Import file ${importPath} does not have a 'prompts' array. Initializing it.`);
          categoryPromptsFile.prompts = [];
          await safeWriteFile(fullImportPath, JSON.stringify(categoryPromptsFile, null, 2), "utf8");
        } else if (!Array.isArray(categoryPromptsFile.prompts)) {
          log.warn(`Import file ${importPath} has an invalid 'prompts' property (not an array). Resetting it.`);
          categoryPromptsFile.prompts = [];
          await safeWriteFile(fullImportPath, JSON.stringify(categoryPromptsFile, null, 2), "utf8");
        }
        
          // Update the file path to be relative to the category folder
          const categoryPath = path.dirname(importPath);
          const categoryPrompts = categoryPromptsFile.prompts.map((prompt: PromptData) => {
          // Ensure prompt has all required properties
          if (!prompt.id || !prompt.name || !prompt.file) {
            log.warn(`Skipping invalid prompt in ${importPath}: missing required properties`);
            return null;
          }
          
            // If the file path is already absolute or starts with the category folder, keep it as is
            if (prompt.file.startsWith('/') || prompt.file.startsWith(categoryPath)) {
              return prompt;
            }
            
            // Otherwise, update the file path to include the category folder
            return {
              ...prompt,
              file: path.join(categoryPath, prompt.file)
            };
        }).filter(Boolean); // Remove any null entries (invalid prompts)
          
          // Add the prompts to the array
          allPrompts = [...allPrompts, ...categoryPrompts];
      } catch (error) {
        log.error(`Error loading prompts from ${importPath}:`, error);
      }
    }
    
    return { promptsData: allPrompts, categories };
  } catch (error) {
    log.error(`Error loading category prompts:`, error);
    throw error;
  }
}

// Helper function to clear the require cache
function clearRequireCache() {
  // Get all cached module paths
  const cachedModulePaths = Object.keys(require.cache);
  
  // Filter for prompt files and configs
  const promptPaths = cachedModulePaths.filter(modulePath => 
    modulePath.includes('prompts/') || 
    modulePath.includes('prompts.json') || 
    modulePath.endsWith('.md')
  );
  
  // Clear them from cache
  promptPaths.forEach(modulePath => {
    delete require.cache[modulePath];
    log.debug(`Cleared from require cache: ${modulePath}`);
  });
  
  log.info(`Cleared ${promptPaths.length} prompt-related modules from require cache`);
}

// Add this function after the reRegisterAllPrompts function

/**
 * Completely refreshes the server's prompt registry and routing table
 * This is more comprehensive than just reloading prompts and re-registering them
 * It ensures that all caches are cleared and all routes are re-registered
 */
async function fullServerRefresh(): Promise<void> {
  try {
    log.info("Performing full server refresh...");
    
    // Step 1: Clear all caches
    clearRequireCache();
    
    // Step 2: Clear server-side caches if available
    if (typeof (server as any).clearCache === 'function') {
      try {
        (server as any).clearCache();
        log.info("Cleared server-side prompt cache");
      } catch (cacheClearError) {
        log.warn("Could not clear server-side cache:", cacheClearError);
      }
    }
    
    // Step 3: Unregister all existing prompts if possible
    if (typeof (server as any).unregisterAllPrompts === 'function') {
      try {
        (server as any).unregisterAllPrompts();
        log.info("Unregistered all existing prompts");
      } catch (unregisterError) {
        log.warn("Could not unregister existing prompts:", unregisterError);
      }
    }
    
    // Step 4: Reload all prompts from disk
    const result = await reloadPrompts();
    log.info(`Reloaded ${result.promptsData.length} prompts from disk`);
    
    // Step 5: Re-register all prompts with the server
    await reRegisterAllPrompts(result.convertedPrompts);
    log.info(`Re-registered ${result.convertedPrompts.length} prompts with the server`);
    
    // Step 6: Force garbage collection if available (helps with memory usage)
    if (global.gc) {
      try {
        global.gc();
        log.info("Forced garbage collection");
      } catch (gcError) {
        log.warn("Could not force garbage collection:", gcError);
      }
    }
    
    // Step 7: Notify that refresh is complete
    log.info("Full server refresh completed successfully");
  } catch (error) {
    log.error("Error during full server refresh:", error);
    throw error;
  }
}

// Helper function to trigger a server refresh via the API
async function triggerServerRefresh(restart: boolean = false, reason: string = ""): Promise<void> {
  try {
    log.info(`Triggering server refresh via API${restart ? ' with restart' : ''}`);
    
    // Make a request to the reload_prompts API endpoint
    const response = await fetch(`http://localhost:${config.server.port || 9090}/api/v1/tools/reload_prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        restart: restart,
        reason: reason
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      log.error(`Server refresh API call failed: ${errorData.message || response.statusText}`);
    } else {
      const result = await response.json();
      log.info(`Server refresh API call succeeded: ${result.message}`);
    }
  } catch (error) {
    log.error("Error triggering server refresh via API:", error);
    // Fall back to direct refresh if API call fails
    try {
      await fullServerRefresh();
      log.info("Completed direct server refresh after API call failed");
      
      // If restart was requested, also handle that
      if (restart) {
        await handleServerRestart(reason);
      }
    } catch (directRefreshError) {
      log.error("Direct server refresh also failed:", directRefreshError);
    }
  }
}

// Add this after the other tool definitions

// Add this function to handle server restart
async function handleServerRestart(reason: string): Promise<void> {
  try {
    log.info(`Initiating server restart: ${reason}`);
    
    // First, perform a full server refresh to ensure all prompts are up to date
    try {
      await fullServerRefresh();
      log.info("Completed full server refresh before restart");
    } catch (refreshError) {
      log.error("Error refreshing server before restart:", refreshError);
      // Continue with restart even if refresh fails
    }
    
    // Schedule the actual restart after a short delay
    setTimeout(() => {
      try {
        // Close all connections and shut down the server gracefully
        if (server && typeof (server as any).close === 'function') {
          (server as any).close(() => {
            log.info("Server closed successfully, restarting...");
            
            // Use the Node.js process manager to restart
            if (process.send) {
              // If running under a process manager like PM2
              process.send('restart');
            } else {
              // Otherwise, exit with a special code that can be caught by a wrapper script
              log.info("Exiting with restart code 100");
              process.exit(100);
            }
          });
        } else {
          log.warn("Server close method not available, using direct exit");
          process.exit(100);
        }
      } catch (error) {
        log.error("Error during server restart:", error);
        process.exit(1);
      }
    }, 1000);
  } catch (error) {
    log.error("Error in handleServerRestart:", error);
    throw error;
  }
}

// Register the reload_prompts tool
server.tool(
  "reload_prompts",
  {
    restart: z.boolean().optional().describe("Whether to restart the server after reloading prompts"),
    reason: z.string().optional().describe("Optional reason for reloading/restarting")
  },
  async ({ restart, reason }, extra) => {
    try {
      const reloadReason = reason || "Manual reload requested";
      log.info(`Reload prompts request received${restart ? ' with restart' : ''}: ${reloadReason}`);
      
      // First, perform a full server refresh
      try {
        await fullServerRefresh();
        log.info("Completed full server refresh");
      } catch (refreshError) {
        log.error("Error refreshing server:", refreshError);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error refreshing server: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`
            }
          ],
          isError: true
        };
      }
      
      // If restart is requested, handle it
      if (restart) {
        // Send a response before initiating the restart
        const response = {
          content: [
            {
              type: "text" as const,
              text: `Successfully reloaded ${promptsData.length} prompts from ${categories.length} categories.\n\nServer is now restarting. Reason: ${reloadReason}\n\nThe server will be back online in a few seconds. You may need to refresh your client.`
            }
          ]
        };
        
        // Schedule the restart to happen after the response is sent
        setTimeout(async () => {
          try {
            await handleServerRestart(reloadReason);
          } catch (error) {
            log.error("Error handling server restart:", error);
          }
        }, 1000);
        
        return response;
      }
      
      // Normal response without restart
      return {
        content: [
          {
            type: "text" as const,
            text: `Successfully reloaded ${promptsData.length} prompts from ${categories.length} categories.`
          }
        ]
      };
    } catch (error) {
      log.error("Error in reload_prompts tool:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to reload prompts: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);