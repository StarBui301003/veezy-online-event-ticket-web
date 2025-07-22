export interface Attendance {
  attendanceId: string;
  eventName: string;
  attendedAt: string;
  status: 'attended' | 'not_attended';
} 