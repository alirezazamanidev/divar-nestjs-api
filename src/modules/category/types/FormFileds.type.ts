

export interface FormField {
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    };
}