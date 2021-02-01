export const isJSON: (str: string) => boolean =
    (str: string) => /^[ \r\n\t]*[{\[]/.test(str)