export interface FieldOption {
  value: string;
  url?: string;
  prompt?: string;
  label?: string;
  title?: string;
}

export interface RoleDict {
  key: string;
  title: string;
  required: boolean;
  max_select: number;
  depends: Array<[string, string[]]>;
  input_type: string;
  options: FieldOption[];
}

export type CreateDialogFormData = API.Character.Setting & {
  creationMode?: 'fast' | 'custom';
};

