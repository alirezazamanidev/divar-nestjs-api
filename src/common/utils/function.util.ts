import { dateFromEnum } from "../enums/filter.enum";

export const isBoolean = (value: any) =>
  ['false', false, 'true', true].includes(value);

export function toBoolean(value: any) {
  return [true, 'true'].includes(value)
    ? true
    : [false, 'false'].includes(value)
      ? false
      : value;
}

export function getDateFromEnum(dateFrom: string) {
  const date = new Date();
  switch (dateFrom) {
    case dateFromEnum.LAST_MONTH:
      date.setMonth(date.getMonth() - 1);
      break;
    case dateFromEnum.TWO_MONTHS_AGO:
      date.setMonth(date.getMonth() - 2);
      break;
    case dateFromEnum.THREE_MONTHS_AGO:
      date.setMonth(date.getMonth() - 3);
      break;
    case dateFromEnum.SIX_MONTHS_AGO:
      date.setMonth(date.getMonth() - 6);
      break;
  }
  return date;
}
export const getpaymentredirectUrl = (status: "success" | 'error' |'cancel', method?: string, amount?: number) => {
  const params: Record<string, string> = {
    status,
    method: method || '',
    amount: amount ? amount.toString() : '',
  };
  return `${process.env.FRONTEND_URL}?${new URLSearchParams(params).toString()}`;

}
export const createSlug = (title:string) => {

  return `${title.trim().toLowerCase().replace(/ /g,'-')}-${Date.now().toString(36)}`
}