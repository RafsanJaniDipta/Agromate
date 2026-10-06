// Contract with the backend's crop-planning endpoints:
//   GET  /api/crops              (public)  — catalog of crops
//   GET  /api/crop-cycles        (farmer)  — this farmer's crop cycles
//   GET  /api/farms              (farmer)  — farms → fields
//   POST /api/crop-cycles        (farmer)  — start a crop (auto-builds the plan)
//   GET  /api/crop-cycles/:id/plan        — milestones + tasks + progress
//   PATCH /api/crop-cycles/:id/tasks/:taskId — mark a task done / reopen
// Dates are ISO strings; day offsets count from the planting date (0-based).

export type Crop = {
  id: string;
  name: string;
  nameBn: string | null;
  category: string | null;
  season: string | null;
  idealSoil: string | null;
  optimalTemp: number | null;
  optimalRainfall: number | null;
  durationDays: number | null;
  // Cultivation-plan info: null means this crop has no ready-made plan yet
  planDurationDays: number | null;
  planDurationLabel: string | null;
  description: string | null;
  descriptionBn: string | null;
};

export type Field = {
  id: string;
  name: string;
  farmId: string;
  areaInAcres: number | null;
  soilType: string | null;
};

export type Farm = {
  id: string;
  name: string;
  location: string;
  areaInAcres: number | null;
  soilType: string | null;
  fields: Field[];
};

export type CropCycleSummary = {
  id: string;
  fieldId: string;
  cropId: string;
  plantingDate: string;
  expectedHarvestDate: string | null;
  actualHarvestDate: string | null;
  growthStage: string | null;
  status: string;
  notes: string | null;
  crop: { id: string; name: string; nameBn: string | null };
  field: Field;
};

export type PlanTask = {
  id: string;
  title: string;
  titleBn: string | null;
  description: string | null;
  suggestedDay: number;
  dueDate: string | null;
  isDone: boolean;
  completedAt: string | null;
};

export type MilestoneStatus = "PENDING" | "PARTIAL" | "DONE";

export type PlanMilestone = {
  name: string;
  nameBn: string | null;
  dayStart: number;
  dayEnd: number;
  startDate: string;
  endDate: string;
  status: MilestoneStatus;
  doneTasks: number;
  totalTasks: number;
  tasks: PlanTask[];
};

export type CropPlan = {
  cycleId: string;
  crop: { id: string; name: string; nameBn: string | null };
  durationDays: number;
  durationLabel: string | null;
  timeline: {
    plantingDate: string;
    expectedHarvestDate: string | null;
  };
  progress: {
    totalTasks: number;
    doneTasks: number;
    percent: number;
  };
  milestones: PlanMilestone[];
};