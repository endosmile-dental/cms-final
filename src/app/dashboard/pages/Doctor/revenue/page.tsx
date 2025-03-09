"use client";

import React, { useMemo } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
import DashboardPieChart from "@/app/dashboard/ui/DashboardPieChart";
import ReusableTable from "@/app/dashboard/ui/DashboardTable";
import { useAppSelector } from "@/app/redux/store/hooks";
import { BillingRecord, selectBillings } from "@/app/redux/slices/billingSlice";
import { format } from "date-fns";
import {
  ReceiptIndianRupee,
  DollarSign,
  TrendingUp,
  PieChart,
} from "lucide-react";

export default function RevenueDashboard() {
  const billings = useAppSelector(selectBillings);

  // Compute advanced analytics from the billing data
  const analytics = useMemo(() => {
    if (!billings || billings.length === 0) {
      return {
        totalRevenue: 0,
        totalReceived: 0,
        totalOutstanding: 0,
        averageInvoice: 0,
        averageDiscount: 0,
        revenueByPaymentMode: {} as Record<string, number>,
        monthlyRevenue: {} as Record<string, number>,
      };
    }

    let totalRevenue = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let totalDiscount = 0;
    let invoiceCount = 0;
    const revenueByPaymentMode: Record<string, number> = {};
    const monthlyRevenue: Record<string, number> = {};

    billings.forEach((billing: BillingRecord) => {
      // totalAmount is already computed in the model (amountBeforeDiscount - discount)
      totalRevenue += billing.totalAmount;
      totalReceived += billing.amountReceived;
      totalOutstanding += billing.amountDue;
      totalDiscount += billing.discount || 0;
      invoiceCount += 1;

      // Aggregate revenue by payment mode
      const mode = billing.modeOfPayment;
      revenueByPaymentMode[mode] =
        (revenueByPaymentMode[mode] || 0) + billing.totalAmount;

      // Aggregate monthly revenue using billing date
      const month = format(new Date(billing.date), "yyyy-MM");
      monthlyRevenue[month] =
        (monthlyRevenue[month] || 0) + billing.totalAmount;
    });

    return {
      totalRevenue,
      totalReceived,
      totalOutstanding,
      averageInvoice: invoiceCount ? totalRevenue / invoiceCount : 0,
      averageDiscount: invoiceCount ? totalDiscount / invoiceCount : 0,
      revenueByPaymentMode,
      monthlyRevenue,
    };
  }, [billings]);

  // Prepare stat cards
  const stats: Stat[] = [
    {
      title: "Total Revenue",
      value: `₹ ${analytics.totalRevenue.toLocaleString()}`,
      icon: <ReceiptIndianRupee size={24} color="white" />,
      color: "bg-orange-500",
      LinkURL: "",
    },
    {
      title: "Amount Received",
      value: `₹ ${analytics.totalReceived.toLocaleString()}`,
      icon: <DollarSign size={24} color="white" />,
      color: "bg-green-500",
      LinkURL: "",
    },
    {
      title: "Outstanding",
      value: `₹ ${analytics.totalOutstanding.toLocaleString()}`,
      icon: <TrendingUp size={24} color="white" />,
      color: "bg-red-500",
      LinkURL: "",
    },
    {
      title: "Average Invoice",
      value: `₹ ${analytics.averageInvoice.toFixed(2)}`,
      icon: <ReceiptIndianRupee size={24} color="white" />,
      color: "bg-blue-500",
      LinkURL: "",
    },
    {
      title: "Avg. Discount",
      value: `₹ ${analytics.averageDiscount.toFixed(2)}`,
      icon: <PieChart size={24} color="white" />,
      color: "bg-purple-500",
      LinkURL: "",
    },
  ];

  // Prepare data for a monthly revenue trend chart
  const monthlyData = useMemo(() => {
    const months = Object.keys(analytics.monthlyRevenue).sort();
    return months.map((month) => ({
      month,
      users: analytics.monthlyRevenue[month],
    }));
  }, [analytics.monthlyRevenue]);

  // Prepare data for a pie chart showing revenue by payment mode
  const paymentModeData = useMemo(() => {
    return Object.entries(analytics.revenueByPaymentMode).map(
      ([mode, revenue]) => ({
        name: mode,
        value: revenue,
      })
    );
  }, [analytics.revenueByPaymentMode]);

  // Optional: Table columns to display detailed billing records
  const billingTableColumns = [
    { header: "Invoice ID", accessor: (row: BillingRecord) => row.invoiceId },
    { header: "Patient ID", accessor: (row: BillingRecord) => row.patientId },
    {
      header: "Date",
      accessor: (row: BillingRecord) => format(new Date(row.date), "yyyy-MM-dd"),
    },
    { header: "Total Amount", accessor: (row: BillingRecord) => `₹ ${row.totalAmount}` },
    { header: "Discount", accessor: (row: BillingRecord) => `₹ ${row.discount}` },
    {
      header: "Amount Received",
      accessor: (row: BillingRecord) => `₹ ${row.amountReceived}`,
    },
    { header: "Amount Due", accessor: (row: BillingRecord) => `₹ ${row.amountDue}` },
    { header: "Payment Mode", accessor: (row: BillingRecord) => row.modeOfPayment },
    { header: "Status", accessor: (row: BillingRecord) => row.status },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <DashboardCards stats={stats} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardChart
            title="Monthly Revenue Trend"
            data={monthlyData}
            // Pass additional chart configurations as needed
          />
          <DashboardPieChart
            title="Revenue by Payment Mode"
            data={paymentModeData}
          />
        </div>

        <div>
          <ReusableTable
            title="Billing Details"
            data={billings}
            columns={billingTableColumns}
            emptyMessage="No billing data available."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
