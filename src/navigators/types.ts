// /src/navigators/types.ts

// --- Reusable types (can also live elsewhere like /src/types/ if preferred) ---
export interface ReportFormState {
    fullName: string;
    email: string;
    reportType: 'Product' | 'Drug';
    identifier: string;
    productName: string;
    category: string;
    specifications: string;
    issueReview: string;
  }
  
  export interface SelectedFileInfo {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
  }
  
  export interface MedicalHistoryFormState {
    usageDate: string;
    allergies: string;
    symptoms: string;
    extras: string;
    medicalAttention: boolean;
    hospitalName: string;
    prescriptions: string;
    selectedReportInfo?: SelectedFileInfo | null;
  }
  
  export type ReviewSubmitRouteParams = {
      reportData: ReportFormState;
      medicalData: MedicalHistoryFormState;
  }
  
  // --- Navigator Param List ---
  // List ALL screens managed by the navigator defined in root_navigator.tsx
  export type RootStackParamList = {
    ReportIncident: undefined;
    MedicalHistory: { reportData: ReportFormState };
    ReviewSubmit: ReviewSubmitRouteParams;
    // Add other screens here that are part of this specific stack
    // For example, if TermsAndConditions is in this stack:
    // TermsAndConditions: { acceptance_callback: () => void };
    // Signup: undefined;
  };