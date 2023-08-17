import Decimal from "break_infinity.js";
import { ArmyComponent } from "./army_comps";
import { Stats, SubStats, PriceHandler } from "./stats";
import { StuffType } from "./types";
import { Boss, Moveset, AttackMove, AttackDefenseMove, DefenseMove } from "./boss";

//For save files: field separator: /*/ ; page separator: '*/*'
export const stuff: StuffType<ArmyComponent, Boss> = {
  //Here are the weapons useable in the game
  weapons: {
    "None": new ArmyComponent(),
    "Knife": new ArmyComponent("Knife", "A thrustworthy knife, even if it is not the best for your needs. Simple to use and reliable.",
      new Stats(["Attack"], [new SubStats(new Decimal(1))]), new Stats(["Hands"], [new Decimal(-1)]),
      new Stats([], []), "Weapon",
      new PriceHandler([new Decimal(100), new Decimal(200), new Decimal(1000)], ["ar", "ar", "ar", "ge"], [new Decimal(1), new Decimal(10), new Decimal(250), new Decimal(1.05)], new Decimal(25))),
    "Dagger": new ArmyComponent("Dagger", "A bit better than a knife, but pricier too.",
      new Stats(["Attack"], [new SubStats(new Decimal(1.2))]), new Stats(["Hands"], [new Decimal(-1)]),
      new Stats([], []), "Weapon",
      new PriceHandler([new Decimal(100), new Decimal(300), new Decimal(1000)], ["ar", "ar", "ar", "ge"], [new Decimal(2), new Decimal(15), new Decimal(450), new Decimal(1.07)], new Decimal(150))),
    "Longsword": new ArmyComponent("Longsword", "A twohanded sword, strong against unarmored opponents",
      new Stats(["Attack"], [new SubStats(new Decimal(2.5))]), new Stats(["Hands"], [new Decimal(-2)]),
      new Stats(["Attack"], [new SubStats(new Decimal(1.1))]), "Weapon",
      new PriceHandler([new Decimal(90), new Decimal(270), new Decimal(900)], ["ar", "ar", "ar", "ge"], [new Decimal(5), new Decimal(25), new Decimal(1000), new Decimal(1.1)], new Decimal(500))),
  },
  //Here are all the creatures useable in the game
  creatures: {
    "None": new ArmyComponent(),
    "Human": new ArmyComponent("Human", "A cheap and reliable worker. Not too efficient, but this is the best you will get for your money.",
      new Stats(["Health", "Attack"], [new Decimal(10), new SubStats(new Decimal(1))]), new Stats(["Hands"], [new Decimal(2)]),
      new Stats([], []), "Creature",
      new PriceHandler([new Decimal(4), new Decimal(100), new Decimal(500)], ["ar", "ar", "ar", "ar"], [new Decimal(0), new Decimal(1), new Decimal(10), new Decimal(100)], new Decimal(5)))
  },
  bosses: {
    "Slime": new Boss("Slime", "A giant slime with a giant ego. He is the guardian of the exit of the first floor.",
      new Stats(["Attack", "Defense", "Health"], [new SubStats(new Decimal(90)), new SubStats(new Decimal(25)), new Decimal(10000)]),
      "Mini", new Decimal(0), new Moveset([
        [new AttackMove("Basic Attack", "A normal attack from a normal enemy.(Attack x1, , Targets: 1)", [new Decimal(1)], ["mul"]),
        new AttackMove("Basic Double Attack", "A normal attack from a normal enemy targeting two beings at once.(Attack x1, , Targets: 2)", [new Decimal(1)], ["mul"], new Decimal(2))],
        [new AttackMove("Triple Attack", "A normal attack from a normal enemy targeting three beings at once.(Attack x1, , Targets: 3)", [new Decimal(1)], ["mul"], new Decimal(3)),
        new AttackDefenseMove("Attack and Defend", "The enemy takes a stance where defending and attacking is easier.(Attack and Defense x2, Targets: 2)", [new AttackMove("", "", [new Decimal(2)], ["mul"], new Decimal(2)), new DefenseMove("", "", [new Decimal(2)], ["mul"])])],
        [new AttackMove("Fife-Fold Attack", "The slime empowers itself, then attacks five enemies at once with slightly increased prowess (Attack x1, Targets: 5).", [new Decimal(1)], ["mul"], new Decimal(5))]
      ])),
  }
}