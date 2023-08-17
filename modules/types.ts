import Decimal from "break_infinity.js";
import { ArmyComponent } from "./army_comps";
import { Boss } from "./boss";

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
export type StuffType = ArmyCompsI<StringHashT<ArmyComponent>>
  & {
    bosses: StringHashT<Boss>,
  }