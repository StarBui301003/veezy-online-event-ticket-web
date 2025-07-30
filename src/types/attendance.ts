export interface Attendance {
  attendanceId: string;
  eventName: string;
  checkedInAt: string;
  status: 'attended' | 'not_attended';
} 