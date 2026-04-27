export interface AssistantDashboardDTO {
  stats: {
    totalAppointmentsToday: number;
    upcomingAppointments: number;
    totalPatients: number;
    availableDoctors: number;
  };

  charts: {
    appointmentsByStatus: {
      name: string;
      value: number;
    }[];

    appointmentsTrend: {
      date: string;
      scheduled: number;
      completed: number;
      cancelled: number;
    }[];

    doctorsAppointments: {
      doctorName: string;
      appointmentCount: number;
    }[];
  };

  calendar: {
    date: string; // "yyyy-MM-dd"
    count: number;
    appointments: {
      patientName: string;
      doctorName: string;
      contactNumber?: string;
      timeSlot: string;
      treatments: string[];
      teeth: string[];
      consultationType?: string;
    }[];
  }[];

  weekAppointments: {
    _id: string;
    patientName: string;
    doctorName: string;
    appointmentDate: string; // "yyyy-MM-dd"
    timeSlot: string;
    status: "Scheduled" | "Completed" | "Cancelled" | "NoShow";
    contactNumber?: string;
  }[];

  todayAppointments: {
    _id: string;
    patientName: string;
    doctorName: string;
    timeSlot: string;
    status: "Scheduled" | "Completed" | "Cancelled" | "NoShow";
    contactNumber?: string;
  }[];

  upcomingAppointments: {
    _id: string;
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    timeSlot: string;
    status: "Scheduled" | "Completed" | "Cancelled" | "NoShow";
    contactNumber?: string;
  }[];

  pastAppointments: {
    _id: string;
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    timeSlot: string;
    status: "Scheduled" | "Completed" | "Cancelled" | "NoShow";
    contactNumber?: string;
  }[];

  recentPatients: {
    _id: string;
    fullName: string;
    contactNumber: string;
    email?: string;
    registeredAt: string;
  }[];

  profile: {
    fullName: string;
  };
}
