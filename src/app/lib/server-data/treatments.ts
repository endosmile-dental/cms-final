import dbConnect from "@/app/utils/dbConnect";
import { Treatment } from "@/app/model/Treatment.model";

type TreatmentDoc = {
  toObject: () => Record<string, unknown> & { _id?: { toString?: () => string } | string };
};

/**
 * Server-side function to fetch all active treatments
 * @returns Promise<Treatment[]>
 */
export async function getTreatments() {
  try {
    await dbConnect();

    // Fetch all active treatments
    const treatments = await Treatment.find({ isActive: true })
      .select("-__v")
      .sort({ category: 1, name: 1 });

    // Convert to plain objects to avoid circular reference issues in SSR
    return treatments.map((treatment: TreatmentDoc) => {
      const plainObj = treatment.toObject();
      // Remove any Buffer objects and convert to plain strings
      if (plainObj._id && plainObj._id.toString) {
        plainObj._id = plainObj._id.toString();
      }
      return plainObj;
    });
  } catch (error: unknown) {
    console.error("Error fetching treatments:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch treatments: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching treatments");
  }
}

/**
 * Server-side function to fetch treatments by category
 * @param category - The category to filter treatments by
 * @returns Promise<Treatment[]>
 */
export async function getTreatmentsByCategory(category: string) {
  try {
    await dbConnect();

    // Fetch treatments by category
    const treatments = await Treatment.find({ 
      isActive: true, 
      category 
    })
      .select("-__v")
      .sort({ name: 1 });

    // Convert to plain objects to avoid circular reference issues in SSR
    return treatments.map((treatment: TreatmentDoc) => {
      const plainObj = treatment.toObject();
      // Remove any Buffer objects and convert to plain strings
      if (plainObj._id && plainObj._id.toString) {
        plainObj._id = plainObj._id.toString();
      }
      return plainObj;
    });
  } catch (error: unknown) {
    console.error("Error fetching treatments by category:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch treatments: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching treatments");
  }
}

/**
 * Server-side function to get treatment statistics
 * @returns Promise<{ total: number, byCategory: Record<string, number> }>
 */
export async function getTreatmentStatistics() {
  try {
    await dbConnect();

    // Aggregate treatment statistics
    const stats = await Treatment.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$count" },
          byCategory: {
            $push: {
              category: "$_id",
              count: "$count",
            },
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        byCategory: {},
      };
    }

    const byCategory: Record<string, number> = {};
    stats[0].byCategory.forEach((item: { category: string; count: number }) => {
      byCategory[item.category] = item.count;
    });

    return {
      total: stats[0].total,
      byCategory,
    };
  } catch (error: unknown) {
    console.error("Error fetching treatment statistics:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch treatment statistics: ${error.message}`);
    }
    throw new Error("Unknown error occurred while fetching treatment statistics");
  }
}