export type AdminSchool = "青山國小" | "東原國中";
export type LeaveReviewStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export function canReviewLeave(adminSchool: AdminSchool, assignedSchool: string, status: LeaveReviewStatus): boolean {
  return status === "Pending" && assignedSchool === adminSchool;
}

export function canViewLeaveRegister(_adminSchool: AdminSchool): boolean {
  return true;
}
