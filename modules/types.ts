import { ArmyComponent } from "./army_comps";
import { Boss } from "./boss";

export type StringArray = string[];
export type StringHash<T> = { [key: string]: T }
export type NumberHash<T> = { [key: number]: T }

export type StuffType = {
  creatures: StringHash<ArmyComponent>,
  weapons: StringHash<ArmyComponent>,
  bosses: StringHash<Boss>,
}