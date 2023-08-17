import Decimal from "break_infinity.js";
import { StringHashT } from "./types";

export const getCompareColor = (value1: Decimal | number, value2: Decimal | number) => {
  if (value1 instanceof Decimal && value2 instanceof Decimal) {
    if (value1.gt(value2)) {
      return "red";
    }
    else if (value1.lt(value2)) {
      return "green";
    }
    else {
      return "var(--default-color)";
    }
  }
  else {
    if (value1 == value2) {
      return "var(--default-color)";
    }
    if (value1 > value2) {
      return "red";
    }
    else {
      return "green";
    }
  }
}

//a function to adjust the appearance of decimal numbers (e form and trying to avoid inconsistent numbers messing up the interface, like 48.0000001 instead of 48)
export const stylizeDecimals = (decimal: Decimal, floor = false) => {
  if (decimal.exponent >= 6) {
    return decimal.mantissa.toFixed(2) + "e" + decimal.exponent;
  }
  if (!floor) {
    if (decimal.exponent > 4) {
      return (decimal.mantissa * Math.pow(10, decimal.exponent)).toFixed(0);
    }
    else {
      return (decimal.mantissa * Math.pow(10, decimal.exponent)).toFixed(Math.min(5 - decimal.exponent, 2));
    }
  }
  else {
    return (decimal.mantissa * Math.pow(10, decimal.exponent)).toFixed(0);
  }
}

export const getHtmlElementList = (identifier: string) => {
  return $(identifier).toArray();
}

export const getHtmlElement = (identifier: string) => {
  return $(identifier).get(0)!;
}
export const getPathFromArr = (path: string[]) => path.join(".");
//a function that returns the StatisticClass thisect corresponding to path
export const getObjFromPath = <T>(path: string[], object: StringHashT<T>): T => {
  let strPath = getPathFromArr(path);
  return object[strPath];
}
