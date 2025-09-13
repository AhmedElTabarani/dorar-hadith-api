#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { z } from "zod";

// Configuration
const DEFAULT_BASE_URL = "http://localhost:5000/v1";
const BASE_URL = process.env.DORAR_API_BASE_URL || DEFAULT_BASE_URL;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Validation schemas
const HadithSearchSchema = z.object({
  value: z.string().min(1).describe("Search query for hadith text"),
  page: z.number().int().positive().optional().describe("Page number for pagination"),
  removehtml: z.boolean().optional().describe("Remove HTML tags from results"),
  specialist: z.boolean().optional().describe("Include specialist hadiths"),
  xclude: z.string().optional().describe("Words or phrases to exclude from search"),
  st: z.enum(['w', 'a', 'p']).optional().describe("Search type (w=all words, a=any word, p=exact phrase)"),
  t: z.enum(['*', '0', '1', '2', '3']).optional().describe("Search scope"),
  degree: z.array(z.string()).optional().describe("Hadith degree filters"),
  muhadith: z.array(z.string()).optional().describe("Muhadith (narrator) IDs"),
  books: z.array(z.string()).optional().describe("Book IDs"),
  rawi: z.array(z.string()).optional().describe("Rawi (transmitter) IDs"),
});

const HadithIdSchema = z.object({
  id: z.string().min(1).describe("Hadith ID"),
});

const SharhSearchSchema = z.object({
  value: z.string().min(1).describe("Search query for sharh text"),
  page: z.number().int().positive().optional().describe("Page number for pagination"),
});

const SharhIdSchema = z.object({
  id: z.string().min(1).describe("Sharh ID"),
});

const SharhTextSchema = z.object({
  text: z.string().min(1).describe("Text to search for sharh explanation"),
});

const BookIdSchema = z.object({
  id: z.string().min(1).describe("Book ID"),
});

const MohdithIdSchema = z.object({
  id: z.string().min(1).describe("Mohdith (narrator) ID"),
});

// Helper function to build query parameters
function buildQueryParams(params) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle array parameters like d[], m[], s[], rawi[]
        value.forEach(item => {
          queryParams.append(`${key}[]`, item);
        });
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });
  
  return queryParams.toString();
}

// API call helpers
async function makeApiCall(endpoint, params = {}) {
  try {
    const queryString = buildQueryParams(params);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network Error: Unable to connect to API at ${BASE_URL}`);
    } else {
      throw new Error(`Request Error: ${error.message}`);
    }
  }
}

// Tool definitions
const TOOLS = [
  {
    name: "search_hadith_api",
    description: "Search for hadiths using the Dorar.net API endpoint. This provides comprehensive hadith search with various filters.",
    inputSchema: {
      type: "object",
      properties: {
        value: { type: "string", description: "Search query for hadith text" },
        page: { type: "number", description: "Page number for pagination" },
        removehtml: { type: "boolean", description: "Remove HTML tags from results" },
        specialist: { type: "boolean", description: "Include specialist hadiths" },
        xclude: { type: "string", description: "Words or phrases to exclude from search" },
        st: { type: "string", enum: ["w", "a", "p"], description: "Search type (w=all words, a=any word, p=exact phrase)" },
        t: { type: "string", enum: ["*", "0", "1", "2", "3"], description: "Search scope" },
        degree: { type: "array", items: { type: "string" }, description: "Hadith degree filters" },
        muhadith: { type: "array", items: { type: "string" }, description: "Muhadith (narrator) IDs" },
        books: { type: "array", items: { type: "string" }, description: "Book IDs" },
        rawi: { type: "array", items: { type: "string" }, description: "Rawi (transmitter) IDs" },
      },
      required: ["value"],
    },
  },
  {
    name: "search_hadith_site",
    description: "Search for hadiths using the site data endpoint. Similar to API search but using different data source.",
    inputSchema: {
      type: "object", 
      properties: {
        value: { type: "string", description: "Search query for hadith text" },
        page: { type: "number", description: "Page number for pagination" },
        removehtml: { type: "boolean", description: "Remove HTML tags from results" },
        specialist: { type: "boolean", description: "Include specialist hadiths" },
        xclude: { type: "string", description: "Words or phrases to exclude from search" },
        st: { type: "string", enum: ["w", "a", "p"], description: "Search type (w=all words, a=any word, p=exact phrase)" },
        t: { type: "string", enum: ["*", "0", "1", "2", "3"], description: "Search scope" },
        degree: { type: "array", items: { type: "string" }, description: "Hadith degree filters" },
        muhadith: { type: "array", items: { type: "string" }, description: "Muhadith (narrator) IDs" },
        books: { type: "array", items: { type: "string" }, description: "Book IDs" },
        rawi: { type: "array", items: { type: "string" }, description: "Rawi (transmitter) IDs" },
      },
      required: ["value"],
    },
  },
  {
    name: "get_hadith_by_id",
    description: "Get a specific hadith by its ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_similar_hadiths",
    description: "Get similar hadiths for a given hadith ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_alternate_hadith",
    description: "Get alternate sahih hadith for a given hadith ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_usul_hadith",
    description: "Get the original/root hadith for a given hadith ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "search_sharh",
    description: "Search for sharh (explanations) of hadiths.",
    inputSchema: {
      type: "object",
      properties: {
        value: { type: "string", description: "Search query for sharh text" },
        page: { type: "number", description: "Page number for pagination" },
      },
      required: ["value"],
    },
  },
  {
    name: "get_sharh_by_id",
    description: "Get sharh (explanation) for a hadith by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Sharh ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_sharh_by_text",
    description: "Get sharh (explanation) for a hadith by searching for specific text.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to search for sharh explanation" },
      },
      required: ["text"],
    },
  },
  {
    name: "get_mohdith_info",
    description: "Get information about a muhadith (hadith narrator) by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mohdith (narrator) ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_book_info",
    description: "Get information about a hadith book by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Book ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_books_data",
    description: "Get list of all available hadith books with their IDs and names.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_degrees_data",
    description: "Get list of all hadith degrees (authenticity levels) with their IDs and names.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_method_search_data",
    description: "Get method search data for hadith filtering.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_mohdith_data",
    description: "Get list of all muhaddithun (hadith narrators) with their IDs and names.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_rawi_data",
    description: "Get list of all rawi (hadith transmitters) with their IDs and names.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_zone_search_data",
    description: "Get zone search data for geographic hadith filtering.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "dorar-hadith-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_hadith_api": {
        const params = HadithSearchSchema.parse(args);
        // Map parameter names to match API expectations
        const apiParams = {
          value: params.value,
          page: params.page,
          removehtml: params.removehtml,
          specialist: params.specialist,
          xclude: params.xclude,
          st: params.st,
          t: params.t,
          d: params.degree,
          m: params.muhadith,
          s: params.books,
          rawi: params.rawi,
        };
        const result = await makeApiCall("/api/hadith/search", apiParams);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "search_hadith_site": {
        const params = HadithSearchSchema.parse(args);
        const apiParams = {
          value: params.value,
          page: params.page,
          removehtml: params.removehtml,
          specialist: params.specialist,
          xclude: params.xclude,
          st: params.st,
          t: params.t,
          d: params.degree,
          m: params.muhadith,
          s: params.books,
          rawi: params.rawi,
        };
        const result = await makeApiCall("/site/hadith/search", apiParams);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_hadith_by_id": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_similar_hadiths": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/similar/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_alternate_hadith": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/alternate/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_usul_hadith": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/usul/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "search_sharh": {
        const params = SharhSearchSchema.parse(args);
        const result = await makeApiCall("/site/sharh/search", params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_sharh_by_id": {
        const { id } = SharhIdSchema.parse(args);
        const result = await makeApiCall(`/site/sharh/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_sharh_by_text": {
        const { text } = SharhTextSchema.parse(args);
        const result = await makeApiCall(`/site/sharh/text/${encodeURIComponent(text)}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_mohdith_info": {
        const { id } = MohdithIdSchema.parse(args);
        const result = await makeApiCall(`/site/mohdith/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_book_info": {
        const { id } = BookIdSchema.parse(args);
        const result = await makeApiCall(`/site/book/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_books_data": {
        const result = await makeApiCall("/data/book");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_degrees_data": {
        const result = await makeApiCall("/data/degree");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_method_search_data": {
        const result = await makeApiCall("/data/methodSearch");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_mohdith_data": {
        const result = await makeApiCall("/data/mohdith");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_rawi_data": {
        const result = await makeApiCall("/data/rawi");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_zone_search_data": {
        const result = await makeApiCall("/data/zoneSearch");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Dorar Hadith MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});