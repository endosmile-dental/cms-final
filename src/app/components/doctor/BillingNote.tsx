import React from "react";
import { ArrowRight, FileText, Info, UserSearch } from "lucide-react";

const BillingNote = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm mb-8">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 p-3 rounded-full">
          <Info className="h-6 w-6 text-blue-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Billing Workflow Guide
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100 flex items-start gap-3">
              <div className="bg-blue-50 p-2 rounded-md">
                <UserSearch className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-700">1. Find Patient</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Search patients by name or ID to begin billing process
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100 flex items-start gap-3">
              <div className="bg-indigo-50 p-2 rounded-md">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-700">2. Create Bill</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Fill treatment details and billing information
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100 flex items-start gap-3">
              <div className="bg-green-50 p-2 rounded-md">
                <ArrowRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-700">
                  3. Generate Invoice
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  System will automatically create professional invoice
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Tip:</span> Search for
              &quot;ES000001&quot; to see a sample patient with existing billing
              records
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingNote;
