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
  [JOB_STATUS.SERVICE_ENGINEER_ASSIGNED]: "amber",
  [JOB_STATUS.HOLD]: "red",
  [JOB_STATUS.COMPLETED]: "emerald",
  [JOB_STATUS.CANCELLED]: "slate",
};

export const SERVICE_CENTERS = [
  "Orion Service Point - Dhaka",
  "Orion Service Point - Chattogram",
  "Orion Service Point - Sylhet",
  "Orion Service Point - Khulna",
];

export const SERVICE_ENGINEERS = [
  { name: "Rafiq Islam", center: "Orion Service Point - Dhaka" },
  { name: "Kamal Hossain", center: "Orion Service Point - Dhaka" },
  { name: "Mahin Chowdhury", center: "Orion Service Point - Chattogram" },
  { name: "Tanvir Ahmed", center: "Orion Service Point - Sylhet" },
];

export const BRANDS = ["Orion", "Vestron", "Coolmax", "Aira"];

export const PRODUCTS_BY_BRAND = {
  Orion: ["Split AC 1.5T", "Window AC 1T", "Refrigerator 300L"],
  Vestron: ["Split AC 2T", "Microwave Oven"],
  Coolmax: ["Deep Freezer", "Split AC 1T"],
  Aira: ["Washing Machine 7kg", "Split AC 1.5T"],
};

// Sample rows shared by every listing page (Registered / Assigned / Hold / Completed / Cancelled)
// so the tables have something to render before an API is connected.
export const MOCK_JOBS = [
  {
    id: "CMP-000482",
    bookDateTime: "2026-08-27 10:12 AM",
    scheduleDate: "2026-08-29",
    solveDate: null,
    customerName: "Nusrat Jahan",
    customerNumber: "01711-223344",
    natureOfCall: "Service Required",
    callType: "Break Down",
    assignedTo: "Orion Service Point - Dhaka",
    assignedDateTime: "2026-08-27 11:00 AM",
    status: JOB_STATUS.SERVICE_CENTER_ASSIGNED,
    agingDays: 3,
    holdReason: null,
  },
  {
    id: "CMP-000481",
    bookDateTime: "2026-08-26 04:40 PM",
    scheduleDate: "2026-08-28",
    solveDate: null,
    customerName: "Shakil Ahmed",
    customerNumber: "01822-556677",
    natureOfCall: "Installation",
    callType: "Installation",
    assignedTo: "Rafiq Islam",
    assignedDateTime: "2026-08-27 09:15 AM",
    status: JOB_STATUS.SERVICE_ENGINEER_ASSIGNED,
    agingDays: 4,
    holdReason: null,
  },
  {
    id: "CMP-000479",
    bookDateTime: "2026-08-24 09:05 AM",
    scheduleDate: "2026-08-26",
    solveDate: null,
    customerName: "Farzana Rahman",
    customerNumber: "01911-889900",
    natureOfCall: "Service Required",
    callType: "Paid Service",
    assignedTo: "Kamal Hossain",
    assignedDateTime: "2026-08-25 01:30 PM",
    status: JOB_STATUS.HOLD,
    agingDays: 6,
    holdReason: "Spare Part Shortage",
  },
  {
    id: "CMP-000474",
    bookDateTime: "2026-08-20 11:50 AM",
    scheduleDate: "2026-08-21",
    solveDate: "2026-08-22 03:10 PM",
    customerName: "Imran Kabir",
    customerNumber: "01611-334455",
    natureOfCall: "Service Required",
    callType: "Repeat Call",
    assignedTo: "Mahin Chowdhury",
    assignedDateTime: "2026-08-20 02:00 PM",
    status: JOB_STATUS.COMPLETED,
    agingDays: 0,
    holdReason: null,
  },
  {
    id: "CMP-000470",
    bookDateTime: "2026-08-18 08:30 AM",
    scheduleDate: "2026-08-19",
    solveDate: null,
    customerName: "Ayesha Siddiqua",
    customerNumber: "01511-778899",
    natureOfCall: "Installation",
    callType: "Installation",
    assignedTo: "—",
    assignedDateTime: null,
    status: JOB_STATUS.REGISTERED,
    agingDays: 8,
    holdReason: null,
  },
  {
    id: "CMP-000465",
    bookDateTime: "2026-08-15 02:20 PM",
    scheduleDate: "2026-08-16",
    solveDate: null,
    customerName: "Tanvir Hasan",
    customerNumber: "01311-990011",
    natureOfCall: "Service Required",
    callType: "Break Down",
    assignedTo: "Orion Service Point - Sylhet",
    assignedDateTime: "2026-08-15 03:00 PM",
    status: JOB_STATUS.CANCELLED,
    agingDays: 0,
    holdReason: null,
    cancelReason: "Customer purchased a new unit instead of repair.",
  },
];