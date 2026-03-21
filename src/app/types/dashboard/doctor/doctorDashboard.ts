export interface DoctorDashboardDTO {
  stats: {
    totalPatients: number;
    upcomingAppointments: number;
    todayAppointments: number;
    pendingLabWorks: number;
  };

  charts: {
    appointments: {
      monthly: {
        month: string; // "Jan 2026"
        completed: number;
        scheduled: number;
      }[];
      weekly: {
        week: string; // "2026-W03"
        completed: number;
        scheduled: number;
      }[];
      yearly: {
        year: string; // "2026"
        completed: number;
        scheduled: number;
      }[];
    };

    patientRegistrations: {
      month: string; // "Jan 2026"
      count: number;
    }[];

    treatmentsTaken: {
      weekly: { name: string; value: number }[];
      monthly: { name: string; value: number }[];
      yearly: { name: string; value: number }[];
    };
  };

  calendar: {
    date: string; // "2026-02-07"
    count: number;
    appointments: {
      patientName: string;
      contactNumber?: string; // ✅ Added
      timeSlot: string;
      treatments: string[];
      teeth: string[]; // ✅ Added
    }[];
  }[];

  recentPatients: {
    _id: string;
    fullName: string;
    contactNumber: string;
    age: string;
    registeredAt: string;
  }[];

  profile: {
    fullName: string;
  };
}
