import { CharacterSummary } from '../form-steps';
import type { CreateDialogFormData } from '../../../types';

interface Step5Props {
  form: any;
  characterData?: Partial<API.Character.Setting>;
  characterOptions?: any;
}

/**
 * 第五步：摘要和确认
 */
export function Step5({ form, characterData, characterOptions }: Step5Props) {
  return (
    <form.Subscribe selector={(state: any) => state.values} children={(values: CreateDialogFormData) => {
      const data = characterData || values;
      return (
        <CharacterSummary
          data={data}
          optionGroups={characterOptions?.options}
        />
      );
    }} />
  );
}

