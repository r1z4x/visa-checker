export interface VisaAppointment {
  source_country: string;
  mission_country: string;
  visa_type_id: number;
  visa_category: string;
  visa_subcategory: string;
  people_looking: number;
  center_name: string;
  appointment_date: string;
  book_now_link: string;
  last_checked: string;
}

export interface AppointmentCache {
  [key: string]: boolean;
} 