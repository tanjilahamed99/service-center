// Shared enums / option lists pulled directly from the requirement doc.
// Swap these for API-driven lists once the backend is wired up.

export const JOB_SOURCE_OPTIONS = ["Customer Care", "Retailer", "Sales Representative"];

export const CALL_TYPE_OPTIONS = ["Break Down", "Installation", "Paid Service", "Repeat Call"];

export const NATURE_OF_WORK_OPTIONS = ["Service Required", "Installation", "First Service"];

export const HOLD_SUB_STATUS_OPTIONS = [
  "Pending From Approval",
  "Customer Not Available",
  "Spare Part Shortage",
  "Spare Ordered",
  "Product to Service Center for Repair",
];

export const ACTUAL_ISSUE_OPTIONS = [
  "Service Required",
  "RF PCB Problem",
  "RF LED PCB",
  "Wiring Fault",
  "New Installation",
  "Remote Pairing Problem",
  "Glass Break",
  "General Service",
];

export const CORRECTIVE_ACTION_OPTIONS = [
  "Service Done",
  "Installation Done",
  "PCB Changed",
  "Wiring Done",
  "Glass Changed",
];

export const JOB_STATUS = {
  REGISTERED: "Registered",
  SERVICE_CENTER_ASSIGNED: "Service Center Assigned",
  SERVICE_ENGINEER_ASSIGNED: "Service Engineer Assigned",
  HOLD: "Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const JOB_STATUS_LIST = Object.values(JOB_STATUS);

export const STATUS_TONE = {
  [JOB_STATUS.REGISTERED]: "electric",
  [JOB_STATUS.SERVICE_CENTER_ASSIGNED]: "amber",
  [JOB_STATUS.SERVICE_ENGINEER_ASSIGNED]: "purple",
  [JOB_STATUS.HOLD]: "red",
  [JOB_STATUS.COMPLETED]: "emerald",
  [JOB_STATUS.CANCELLED]: "red",
};

