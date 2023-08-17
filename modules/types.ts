import { ArmyComponent } from "./army_comps";
import { Boss } from "./boss";

export type StringHash<T> = { [key: string]: T }
export type NumberHash<T> = { [key: number]: T }


// Data types
//a type that includes creatures, weapons and more for the future
export interface IArmyComps<T> {
  creatures: T;
  weapons: T;
}
export type StuffType = IArmyComps<StringHash<ArmyComponent>>
  & {
    bosses: StringHash<Boss>,
  }