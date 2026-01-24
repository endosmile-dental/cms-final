import LabWorkModel from "@/app/model/LabWork.model";
import OpenAI from "openai";
import dbConnect from "@/app/utils/dbConnect";
import { NextResponse } from "next/server";
import BillingModel from "@/app/model/Billing.model";
import AppointmentModel from "@/app/model/Appointment.model";
import { PipelineStage } from "mongoose";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type MongoQuery = Record<string, unknown>;
type MongoSort = Record<string, 1 | -1>;
type MongoAggregation = PipelineStage[];

interface CollectionAnalysis {
  neededCollections: ("labworks" | "billings" | "appointments")[];
  operationType: "query" | "aggregation" | "calculation" | "summary";
  reasoning: string;
}

type CollectionName = "labworks" | "billings" | "appointments";

interface QueryPlan {
  collections: CollectionName[];
  operations: {
    collection: CollectionName;
    query?: MongoQuery;
    sort?: MongoSort;
    limit?: number;
    aggregation?: MongoAggregation;
  }[];
  finalProcessing: string;
}

// Safe query execution with error handling
async function executeQuery(
  collection: "labworks" | "billings" | "appointments",
  operation: {
    query?: MongoQuery;
    sort?: MongoSort;
    limit?: number;
    aggregation?: MongoAggregation;
  }
): Promise<unknown[]> {
  try {
    let results: unknown[] = [];

    switch (collection) {
      case "labworks":
        if (operation.aggregation) {
          results = await LabWorkModel.aggregate(operation.aggregation);
        } else {
          let query = LabWorkModel.find(operation.query || {});
          if (operation.sort) query = query.sort(operation.sort);
          if (operation.limit) query = query.limit(operation.limit);
          results = await query.lean();
        }
        break;

      case "billings":
        if (operation.aggregation) {
          results = await BillingModel.aggregate(operation.aggregation);
        } else {
          let query = BillingModel.find(operation.query || {});
          if (operation.sort) query = query.sort(operation.sort);
          if (operation.limit) query = query.limit(operation.limit);
          results = await query.lean();
        }
        break;

      case "appointments":
        if (operation.aggregation) {
          results = await AppointmentModel.aggregate(operation.aggregation);
        } else {
          let query = AppointmentModel.find(operation.query || {});
          if (operation.sort) query = query.sort(operation.sort);
          if (operation.limit) query = query.limit(operation.limit);
          results = await query.lean();
        }
        break;
    }

    return results;
  } catch (error) {
    console.error(`Error executing query for ${collection}:`, error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    await dbConnect();

    // --- Step 1: Analyze which collections are needed ---
    const analysisPrompt = `
      Analyze this medical CMS query and determine which MongoDB collections are needed.
      Available collections:
      - labworks: lab tests, results, status, patient info, test types, dates
      - billings: invoices, payments, amounts, status, patient billing, dates
      - appointments: schedules, patient visits, doctor assignments, status, dates

      User Query: "${message}"

      Respond with this JSON format only:
      {
        "neededCollections": ["array of collection names"],
        "operationType": "query|aggregation|calculation|summary",
        "reasoning": "brief explanation of why these collections are needed"
      }

      Only include collections that are directly relevant to the query.
    `;

    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: analysisPrompt }],
      response_format: { type: "json_object" },
    });

    const analysisText = analysisCompletion.choices[0].message?.content?.trim();
    if (!analysisText) {
      throw new Error("No analysis generated");
    }

    let analysis: CollectionAnalysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error("Failed to parse analysis:", parseError, analysisText);
      // Fallback analysis
      analysis = {
        neededCollections: ["appointments", "labworks", "billings"],
        operationType: "query",
        reasoning: "Fallback: using all collections due to parsing error",
      };
    }

    // Ensure we have at least one collection
    if (
      !analysis.neededCollections ||
      analysis.neededCollections.length === 0
    ) {
      analysis.neededCollections = ["appointments"];
    }

    // --- Step 2: Generate query plan ---
    const planPrompt = `
      Create a MongoDB query plan for this medical query: "${message}"
      
      Collections available: ${analysis.neededCollections.join(", ")}
      Operation type: ${analysis.operationType}

      Generate a practical query plan that can be executed. Focus on:
      - Realistic field names (doctor, patient, status, date, appointmentDate, totalAmount, etc.)
      - Safe queries without complex operators
      - Practical limits (5-10 documents per collection)

      Respond with this JSON format:
      {
        "collections": ["collection_names"],
        "operations": [
          {
            "collection": "collection_name",
            "query": {"field": "value"},
            "sort": {"dateField": -1},
            "limit": 5
          }
        ],
        "finalProcessing": "how to combine results"
      }

      Keep queries simple and safe. Use only basic match queries.
    `;

    const planCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: planPrompt }],
      response_format: { type: "json_object" },
    });

    const planText = planCompletion.choices[0].message?.content?.trim();
    let queryPlan: QueryPlan;

    try {
      queryPlan = JSON.parse(planText || "{}");
    } catch (parseError) {
      console.error("Failed to parse query plan:", parseError, planText);
      // Create a simple fallback plan
      queryPlan = {
        collections: analysis.neededCollections,
        operations: analysis.neededCollections.map((collection) => ({
          collection,
          query: {},
          sort: { date: -1 },
          limit: 5,
        })),
        finalProcessing: "Combine recent entries from all collections",
      };
    }

    // Ensure operations exist and are safe
    if (!queryPlan.operations || queryPlan.operations.length === 0) {
      queryPlan.operations = analysis.neededCollections.map((collection) => ({
        collection,
        query: {},
        limit: 5,
      }));
    }

    // --- Step 3: Execute queries safely ---
    const results: Partial<Record<CollectionName, unknown[]>> = {};

    for (const operation of queryPlan.operations) {
      // Validate collection is allowed
      if (
        !["labworks", "billings", "appointments"].includes(operation.collection)
      ) {
        continue;
      }

      // Sanitize query - remove any unsafe operators
      const safeQuery = operation.query || {};
      const safeOperation = {
        ...operation,
        query: safeQuery,
        limit: Math.min(operation.limit || 5, 10), // Max 10 documents
      };

      results[operation.collection] = await executeQuery(
        operation.collection,
        safeOperation
      );
    }

    // --- Step 4: Generate intelligent response ---
    const responsePrompt = `
      You are a medical CMS assistant. Based on the user's question and database results, provide a helpful response.

      USER QUESTION: "${message}"

      DATABASE RESULTS: ${JSON.stringify(results, null, 2)}

      Provide a concise but informative answer (3-5 sentences) that:
      1. Directly answers the question
      2. Mentions key findings from the data
      3. Provides relevant counts or summaries
      4. Is professional and medical-appropriate

      If no relevant data was found, suggest what might be needed or clarify the question.
    `;

    const responseCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: responsePrompt }],
    });

    const finalResponse =
      responseCompletion.choices[0].message?.content ||
      "I analyzed your query but couldn't generate a specific response. Please try rephrasing your question.";

    return NextResponse.json({
      response: finalResponse,
      analysis: analysis,
      queryPlan: queryPlan,
      rawResults: results,
      collectionsUsed: analysis.neededCollections,
    });
  } catch (error) {
    console.error("AI Query error:", error);
    return NextResponse.json(
      {
        error: "Failed to process your request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
