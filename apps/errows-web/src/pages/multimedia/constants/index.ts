export const PC_CARD_WIDTH = 184;

/**
 * sort by count options
 * 不需要在这里翻译，而是在组件中使用 i18n 的 t() 函数
 */
export const NUMBER_SORTS = [
    { value: 'number', label: 'Number' },
    { value: 'latest', label: 'Latest' },
    {
        value: 'a-z',
        label: 'A-Z'
    }
];

/**
 *  sort by tags
 * label 不需要在这里翻译，而是在组件中使用 i18n 的 t() 函数
 */
export const TAG_SORTS = [
    { value: 'futa', label: 'Futa' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'deleted', label: 'Deleted' },
];


export const FOOTER_OPERATIONS = {
    DOWNLOAD: 'download',
    PREVIEW: 'previewImage',
    GENERATE: 'generateVideo',
    PLAY: 'playVideo',
  } as const;
  