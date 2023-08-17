import Decimal from "break_infinity.js";

export type StringHashT<T> = { [key: string]: T }
export type NumberHashT<T> = { [key: number]: T }

// Data types
//a type that includes creatures, weapons and more for the future
export interface ArmyCompsI<T> {
  creatures: T;
  weapons: T;
}
export interface CurrencyTypesI {
  gold: Decimal
}
export type StuffType<T, B> = ArmyCompsI<StringHashT<T>>
  & {
    bosses: StringHashT<B>,
  }

//for statistics
export type LevelToIndexT = {
  'base': 0
}
export type OverallLevelT = LevelToIndexT & {
  'overall': 0
}