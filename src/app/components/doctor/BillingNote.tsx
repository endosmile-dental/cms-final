import React from "react";
import { ArrowRight, FileText, Info, UserSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BillingNote = () => {
  return (
    <Card className="border-border bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100/50 dark:bg-blue-800/30 p-3 rounded-full">
            <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Billing Workflow Guide</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border-border rounded-lg p-4 flex items-start gap-3">
            <div className="bg-blue-50/50 dark:bg-blue-900/30 p-2 rounded-md">
              <UserSearch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">1. Find Patient</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Search patients by name or ID to begin billing process
              </p>
            </div>
          </div>

          <div className="bg-card border-border rounded-lg p-4 flex items-start gap-3">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/30 p-2 rounded-md">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">2. Create Bill</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Fill treatment details and billing information
              </p>
            </div>
          </div>

          <div className="bg-card border-border rounded-lg p-4 flex items-start gap-3">
            <div className="bg-green-50/50 dark:bg-green-900/30 p-2 rounded-md">
              <ArrowRight className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">
                3. Generate Invoice
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                System will automatically create professional invoice
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50/50 dark:bg-yellow-900/20 border-l-4 border-yellow-400/50 dark:border-yellow-600/50 rounded-md">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            <span className="font-medium">Tip:</span> Search for
            &quot;ES000001&quot; to see a sample patient with existing billing
            records
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingNote;
