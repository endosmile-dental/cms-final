"use client";

import React, { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/app/dashboard/layout/DashboardLayout";
import DashboardCards, { Stat } from "@/app/dashboard/ui/DashboardCards";
import DashboardChart from "@/app/dashboard/ui/DashboardChart";
import DashboardPieChart from "@/app/dashboard/ui/DashboardPieChart";
import { useAppDispatch, useAppSelector } from "@/app/redux/store/hooks";
import {
  BillingRecord,
  selectBillings,
  updateBillingRecord,
  fetchBillings,
} from "@/app/redux/slices/billingSlice";
import {
  format,
  subMonths,
} from "date-fns";
import {
  IndianRupee,
  TrendingUp,
  FileText,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
} from "lucide-react";
import DataTable, { ColumnDef } from "@/app/components/DataTable";
import EditBillingDialog from "@/app/components/doctor/EditBillingDialog";
import { selectPatients } from "@/app/redux/slices/patientSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface RevenueStats {
  totalRevenue: number;
  totalReceived: number;
  totalDue: number;
  averageInvoice: number;
  averageDiscount: number;
  invoiceCount: number;
  paidInvoices: number;
  pendingInvoices: number;
  revenueByPaymentMode: Record<string, number>;
  monthlyRevenue: Record<string, number>;
  topPatients: Array<{ patientName: string; revenue: number }>;
  revenueGrowth: number;
  collectionEfficiency: number;
}

export default function RevenueDashboard() {
  const dispatch = useAppDispatch();
  const billings = useAppSelector(selectBillings);
  const patients = useAppSelector(selectPatients);

  const [selectedBilling, setSelectedBilling] = useState<BillingRecord | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm] = useState("");
  const [statusFilter] = useState("All");
  const [paymentModeFilter] = useState("All");
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data: session } = useSession();

  // Fetch data on component mount
  useEffect(() => {
    if (session?.user?.id) {
      dispatch(fetchBillings({ userId: session.user.id, role: "Doctor" }));
    }
  }, [dispatch, session]);

  const handleRowClick = (billing: BillingRecord) => {
    setSelectedBilling(billing);
    setDialogOpen(true);
  };

  const mappedBillings = useMemo(() => {
    if (!billings || !patients) return [];

    return billings.map((billing) => {
      const patient = patients.find((p) => p._id === billing.patientId);
      return {
        ...billing,
        patientName: patient ? patient.fullName : "Unknown",
      };
    });
  }, [billings, patients]);

  // Advanced revenue analytics with growth calculations
  const analytics = useMemo((): RevenueStats => {
    if (!billings || billings.length === 0) {
      return {
        totalRevenue: 0,
        totalReceived: 0,
        totalDue: 0,
        averageInvoice: 0,
        averageDiscount: 0,
        invoiceCount: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        revenueByPaymentMode: {},
        monthlyRevenue: {},
        topPatients: [],
        revenueGrowth: 0,
        collectionEfficiency: 0,
      };
    }

    let totalRevenue = 0;
    let totalReceived = 0;
    let totalDue = 0;
    let totalDiscount = 0;
    let invoiceCount = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    const revenueByPaymentMode: Record<string, number> = {};
    const monthlyRevenue: Record<string, number> = {};
    const patientRevenue: Record<string, number> = {};

    // Current period (last 30 days) and previous period for growth calculation
    const now = new Date();
    const currentPeriodStart = subMonths(now, 1);
    const previousPeriodStart = subMonths(now, 2);
    const previousPeriodEnd = subMonths(now, 1);

    let currentPeriodRevenue = 0;
    let previousPeriodRevenue = 0;

    billings.forEach((billing: BillingRecord) => {
      const billingDate = new Date(billing.date);
      totalRevenue += billing.totalAmount;
      totalReceived += billing.amountReceived;
      totalDue += billing.amountDue;
      totalDiscount += billing.discount || 0;
      invoiceCount += 1;

      // Count invoices by status
      if (billing.status === "Paid") paidInvoices++;
      else if (billing.status === "Pending") pendingInvoices++;

      // Aggregate revenue by payment mode
      const mode = billing.modeOfPayment;
      revenueByPaymentMode[mode] =
        (revenueByPaymentMode[mode] || 0) + billing.totalAmount;

      // Aggregate monthly revenue
      const month = format(billingDate, "yyyy-MM");
      monthlyRevenue[month] =
        (monthlyRevenue[month] || 0) + billing.totalAmount;

      // Aggregate by patient
      const patient = patients.find((p) => p._id === billing.patientId);
      if (patient) {
        patientRevenue[patient.fullName] =
          (patientRevenue[patient.fullName] || 0) + billing.totalAmount;
      }

      // Calculate growth periods
      if (billingDate >= currentPeriodStart && billingDate <= now) {
        currentPeriodRevenue += billing.totalAmount;
      }
      if (
        billingDate >= previousPeriodStart &&
        billingDate < previousPeriodEnd
      ) {
        previousPeriodRevenue += billing.totalAmount;
      }
    });

    // Calculate growth percentage
    const revenueGrowth =
      previousPeriodRevenue > 0
        ? ((currentPeriodRevenue - previousPeriodRevenue) /
          previousPeriodRevenue) *
        100
        : 0;

    // Calculate collection efficiency
    const collectionEfficiency =
      totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;

    // Get top 5 patients by revenue
    const topPatients = Object.entries(patientRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([patientName, revenue]) => ({ patientName, revenue }));

    return {
      totalRevenue,
      totalReceived,
      totalDue,
      averageInvoice: invoiceCount ? totalRevenue / invoiceCount : 0,
      averageDiscount: invoiceCount ? totalDiscount / invoiceCount : 0,
      invoiceCount,
      paidInvoices,
      pendingInvoices,
      revenueByPaymentMode,
      monthlyRevenue,
      topPatients,
      revenueGrowth,
      collectionEfficiency,
    };
  }, [billings, patients]);

  // Filter billings based on search and filters
  const filteredBillings = useMemo(() => {
    return mappedBillings.filter((billing) => {
      const matchesSearch =
        billing.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        billing.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        billing.modeOfPayment?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || billing.status === statusFilter;
      const matchesPaymentMode =
        paymentModeFilter === "All" ||
        billing.modeOfPayment === paymentModeFilter;

      return matchesSearch && matchesStatus && matchesPaymentMode;
    });
  }, [mappedBillings, searchTerm, statusFilter, paymentModeFilter]);

  // Current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBillings.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredBillings, itemsPerPage]);


  const billingTableColumns: ColumnDef<BillingRecord, keyof BillingRecord>[] = [
    {
      header: "Invoice ID",
      accessorKey: "invoiceId",
      sortable: true,
    },
    {
      header: "Date",
      accessorKey: "date",
      sortable: true,
      render: (value) =>
        value ? new Date(value as string).toLocaleDateString() : "N/A",
    },
    {
      header: "Patient Name",
      accessorKey: "patientName",
      sortable: true,
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      sortable: true,
      render: (value) =>
        typeof value === "number" ? `₹ ${value.toFixed(2)}` : "N/A",
    },
    {
      header: "Discount",
      accessorKey: "discount",
      sortable: true,
      render: (value) =>
        typeof value === "number" ? `₹ ${value.toFixed(2)}` : "N/A",
    },
    {
      header: "Received",
      accessorKey: "amountReceived",
      sortable: true,
      render: (value) =>
        typeof value === "number" ? `₹ ${value.toFixed(2)}` : "N/A",
    },
    {
      header: "Due",
      accessorKey: "amountDue",
      sortable: true,
      render: (value) =>
        typeof value === "number" ? `₹ ${value.toFixed(2)}` : "N/A",
    },
    {
      header: "Mode",
      accessorKey: "modeOfPayment",
      sortable: true,
      render: (value) => (typeof value === "string" ? value : "N/A"),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      render: (value) => {
        const status = value as string;
        const statusConfig = {
          Paid: { color: "bg-green-100 text-green-800", icon: CheckCircle },
          Pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
          Overdue: { color: "bg-red-100 text-red-800", icon: AlertCircle },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
        };
        const IconComponent = config.icon;

        return (
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}
          >
            <IconComponent size={12} />
            {status}
          </div>
        );
      },
    },
  ];

  // Enhanced stat cards with growth indicators
  const stats: Stat[] = [
    {
      title: "Total Revenue",
      value: `₹${analytics.totalRevenue.toLocaleString()}`,
      icon: <TrendingUp size={24} color="white" />,
      color: analytics.revenueGrowth >= 0 ? "bg-green-500" : "bg-red-500",
      LinkURL: "",
    },
    {
      title: "Amount Received",
      value: `₹${analytics.totalReceived.toLocaleString()}`,
      icon: <IndianRupee size={24} color="white" />,
      color: "bg-blue-500",
      LinkURL: "",
    },
    {
      title: "Outstanding Dues",
      value: `₹${analytics.totalDue.toLocaleString()}`,
      icon: <AlertCircle size={24} color="white" />,
      color: "bg-orange-500",
      LinkURL: "",
    },
    {
      title: "Total Invoices",
      value: analytics.invoiceCount.toString(),
      icon: <FileText size={24} color="white" />,
      color: "bg-purple-500",
      LinkURL: "",
    },
  ];

  // Enhanced monthly revenue data - convert to the format DashboardChart expects
  const monthlyData = useMemo(() => {
    const months = Object.keys(analytics.monthlyRevenue).sort();
    return months.map((month) => ({
      month: format(new Date(month + "-01"), "MMM yyyy"),
      users: analytics.monthlyRevenue[month], // Changed from 'revenue' to 'users' to match DashboardChart expectation
    }));
  }, [analytics.monthlyRevenue]);

  // Payment mode distribution
  const paymentModeData = useMemo(() => {
    return Object.entries(analytics.revenueByPaymentMode).map(
      ([mode, revenue]) => ({
        name: mode,
        value: revenue,
      })
    );
  }, [analytics.revenueByPaymentMode]);

  // Top patients data for bar chart
  // const topPatientsData = useMemo(() => {
  //   return analytics.topPatients.map((patient, index) => ({
  //     patient: patient.patientName.split(" ")[0], // First name only
  //     revenue: patient.revenue,
  //     rank: index + 1,
  //   }));
  // }, [analytics.topPatients]);

  const exportToCSV = () => {
    const headers = [
      "Invoice ID",
      "Date",
      "Patient",
      "Total Amount",
      "Discount",
      "Received",
      "Due",
      "Payment Mode",
      "Status",
    ];
    const csvData = filteredBillings.map((billing) => [
      billing.invoiceId,
      new Date(billing.date).toLocaleDateString(),
      billing.patientName,
      billing.totalAmount,
      billing.discount,
      billing.amountReceived,
      billing.amountDue,
      billing.modeOfPayment,
      billing.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <BarChart3 className="text-green-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Revenue Dashboard
              </h1>
              <p className="text-gray-600">
                Analyze and export clinic revenue and financial insights
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
              onClick={exportToCSV}
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardCards stats={stats} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardChart title="Monthly Revenue Trend" data={monthlyData} />

          <DashboardPieChart
            title="Revenue by Payment Mode"
            data={paymentModeData}
            enableTimeFrameSort={false}
            innerRadius={50}
            showPercentage={true}
            showLegend={true}
          />
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Patients */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users size={18} />
                Top Patients by Revenue
              </h3>
              <div className="space-y-3">
                {analytics.topPatients.map((patient, index) => (
                  <div
                    key={patient.patientName}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">
                        {patient.patientName}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      ₹{patient.revenue.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Distribution */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard size={18} />
                Payment Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(analytics.revenueByPaymentMode).map(
                  ([mode, amount]) => (
                    <div
                      key={mode}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{mode}</span>
                      <span className="font-medium">
                        ₹{amount.toLocaleString()}
                      </span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collection Efficiency */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={18} />
                Collection Performance
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Collection Rate</span>
                    <span>{analytics.collectionEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analytics.collectionEfficiency}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.paidInvoices}
                    </div>
                    <div className="text-xs text-green-600">Paid Invoices</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics.pendingInvoices}
                    </div>
                    <div className="text-xs text-orange-600">
                      Pending Invoices
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Table */}
        <Card>
          <CardContent className="p-6">
            <DataTable
              title="Billing Records"
              data={currentItems}
              columns={billingTableColumns}
              searchFields={[
                "invoiceId",
                "patientName",
                "modeOfPayment",
                "status",
              ]}
              showSearch={true} // We have our own search
              onRowClick={handleRowClick}
              enableDateFilter={true}
              dateField="date"
            />
          </CardContent>
        </Card>

        {/* Edit Billing Dialog */}
        {selectedBilling && (
          <EditBillingDialog
            open={dialogOpen}
            billing={selectedBilling}
            onClose={() => setDialogOpen(false)}
            onSave={(updatedBilling) => {
              if (updatedBilling && updatedBilling._id) {
                dispatch(
                  updateBillingRecord({
                    billingId: updatedBilling._id,
                    updatedBillingData: updatedBilling,
                  })
                );
              }
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
