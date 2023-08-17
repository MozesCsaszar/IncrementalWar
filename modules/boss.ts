import Decimal from "break_infinity.js";
import { stuff } from "./data";
import { Stats, SubStats } from "./stats";
import { NumberHashT } from "./types";
import { Army } from "./army";
import { ButtonGroupClass, PageClass, Fight } from "./base_classes";
import { GM, Player } from "../IncrementalWar";
import { BossFightingPage } from "./pages/boss/fighting";

class CombatMove {
  name: string;
  desc: string;
  constructor(name: string, desc: string) {
    this.name = name;
    this.desc = desc;
  }

  modifyStats(stats: Stats) {
    return stats;
  }
}

interface IAttackMove {
  attackTargets: Decimal;
}
interface IDefenseMove {
  defenseTargets: Decimal;
}

//A move that only modifies the 'Attack' value of one or more stats thisect(s)
export class AttackMove extends CombatMove implements IAttackMove {
  modifiers: Decimal[];
  modifierTypes: string[];
  attackTargets: Decimal;
  constructor(name: string, desc: string, modifiers: Decimal[] = [], modifierTypes: string[] = [], targets = new Decimal(1)) {
    super(name, desc);
    this.modifiers = modifiers;
    this.modifierTypes = modifierTypes;
    this.attackTargets = targets;
  }

  modifyStats(stats: Stats) {
    stats = stats.add(new Stats([], [])) as Stats;
    for (let i = 0; i < this.modifierTypes.length; i++) {
      const func = stats.get<SubStats>("Attack").get<(o: unknown) => SubStats>(this.modifierTypes[i]);
      stats.set("Attack", func(this.modifiers[i]));
    }
    stats.set("Attack", stats.get<Stats>("Attack"));
    return stats;
  }
}

//A move that only modifies the 'Defense' value of one or more stats thisect(s)
export class DefenseMove extends CombatMove implements IDefenseMove {
  modifiers: Decimal[];
  modifierTypes: string[];
  defenseTargets: Decimal;
  constructor(name: string, desc: string, modifiers: Decimal[] = [], modifierTypes: string[] = [], targets = new Decimal(1)) {
    super(name, desc);
    this.modifiers = modifiers;
    this.modifierTypes = modifierTypes;
    this.defenseTargets = targets;
  }

  modifyStats(stats: Stats) {
    stats = stats.add(new Stats([], []));
    for (let i = 0; i < this.modifierTypes.length; i++) {
      const func = stats.get<SubStats>("Defense").get<(o: unknown) => SubStats>(this.modifierTypes[i]);
      stats.set("Defense", func(this.modifiers[i]));
    }
    return stats;
  }
}

//A move that only modifies the 'Healht' value of one or more stats thisect(s)
export class HealMove extends CombatMove {

}

//A move that executes a combination of the above
export class AttackDefenseMove extends CombatMove implements IAttackMove, IDefenseMove {
  moves: CombatMove[];
  attackTargets: Decimal;
  defenseTargets: Decimal;
  constructor(name: string, desc: string, moves: CombatMove[] = []) {
    super(name, desc);
    this.moves = moves;
    this.attackTargets = new Decimal(0);
    this.defenseTargets = new Decimal(0);
    //get attack and defense targets
    for (let i = 0; i < this.moves.length; i++) {
      if (this.moves[i] instanceof AttackMove) {
        this.attackTargets = this.attackTargets.add((this.moves[i] as AttackMove).attackTargets);
      }
      else if (this.moves[i] instanceof DefenseMove) {
        this.defenseTargets = this.defenseTargets.add((this.moves[i] as DefenseMove).defenseTargets);
      }
    }
  }

  modifyStats(stats: Stats) {
    for (let i = 0; i < this.moves.length; i++) {
      stats = this.moves[i].modifyStats(stats);
    }
    return stats;
  }
}

//A class that stores Moves with rarity and priority and will choose the apropriate one
/*
    How priorities and rarities work:
        -rarities can be Common (0), Uncommon(1), Rare(2), Special(3) and Ultra Rare(4)
        -each rarity has a 1/2^m chance to be chosen (a random choosing between 1 and 2^n will happen, log_2(rand).floor()
         will be the rarity of the move used)
        -then a move is gotten randomly from the selection
    Please provide moves as a layered array!
*/
export class Moveset {
  static nameTextStart = "<span style=\"color:";
  static moveRarities: NumberHashT<string> = { 0: "Common", 1: "Uncommon", 2: "Rare", 3: "Special", 4: "Super", 5: "Ultra" }
  static rarityColors: NumberHashT<string> = { 0: "aliceblue", 1: "#20d000", 2: "#4848ff", 3: "#b000b0", 4: "#FF0000", 5: "#FF0000" }
  static colorSpanEnd = "\">";
  static nameTextEnd = "</span>"
  moves: CombatMove[][];
  currentMove?: CombatMove;
  currentMovePlace: [number, number];

  constructor(moves: CombatMove[][] = [[]]) {
    this.moves = moves;
    this.currentMove = undefined;
    this.currentMovePlace = [-1, -1];
  }

  getMove() {
    const rarity = this.moves.length - 1 - Math.floor(Math.log2(1 + Math.floor(Math.random() * (2 ** this.moves.length - 1))));
    const move_nr = Math.floor(Math.random() * this.moves[rarity].length);
    this.currentMove = this.moves[rarity][move_nr];
    this.currentMovePlace = [rarity, move_nr];
    return this.currentMove;
  }

  getCurrentMoveName() {
    return this.getMoveName(...this.currentMovePlace);
  }

  getMoveName(rarity: number, move_nr: number) {
    return Moveset.nameTextStart + Moveset.rarityColors[rarity] + Moveset.colorSpanEnd + this.moves[rarity][move_nr].name + " (" +
      Moveset.moveRarities[rarity] + ")" + Moveset.nameTextEnd;
  }

  getMove_description(rarity: number, move_nr: number) {
    return this.moves[rarity][move_nr].desc;
  }
}
/*
    Boss types:
        -Mini, Normal
    Boss soldierLossRatio:
        0 - no soldier lost, 1 - all soldies who are wounded (no Health at the end of fight) are lost,
        (0, 1) - a percentage of wounded soldiers lost
*/
//used for boss and miniboss fights
export class Boss {
  stats: Stats;
  name: string;
  desc: string;
  type: string;
  soldierLossRatio: Decimal;
  attaksPerSecond: number;
  size: number;
  moveset: Moveset;
  constructor(name: string, desc: string, stats: Stats, type: string, soldierLossRatio: Decimal, moveset: Moveset) {
    this.stats = stats;
    this.name = name;
    this.desc = desc;
    this.type = type;
    this.soldierLossRatio = soldierLossRatio;
    this.attaksPerSecond = 1;
    this.size = 100;
    this.moveset = moveset;
  }

  attack() {
    return this.stats.get<SubStats>("Attack");
  }

  getText() {
    let t = "<b>" + this.name + "</b><br>" +
      "<i>" + this.type + "</i><br><br>" +
      this.stats.getText() + "<br>" +
      "Attacks/sec: " + this.attaksPerSecond + "<br>" +
      "Size: " + this.size + "<br>" +
      "Moves: ";
    for (let i = 0; i < this.moveset.moves.length; i++) {
      for (let j = 0; j < this.moveset.moves[i].length; j++) {
        if (i != 0 || j != 0) {
          t += ", "
        }
        t += this.moveset.getMoveName(i, j);
      }
    }
    t += ".<br>";
    return t;
  }
}

//simulates a whole army fighting against a boss
class FightingArmy {
  stats: Stats;
  maxUnits: Decimal;
  units: Decimal;
  maxTotalHealth: Decimal;
  totalHealth: Decimal;
  attackTime: Decimal;
  attackCounter: Decimal;
  size: number;
  deployed: Decimal;
  constructor(army: Army) {
    this.stats = army.stats.add(new Stats([], []));
    this.maxUnits = new Decimal(army.size);
    this.units = new Decimal(army.size);
    this.maxTotalHealth = this.units.mul(this.stats.get<Decimal>("Health"));
    this.totalHealth = this.units.mul(this.stats.get<Decimal>("Health"));
    //when attackCounter reaches attackTime, the army attacks
    this.attackTime = new Decimal(1);
    this.attackCounter = new Decimal(0);

    this.size = 10;
    this.deployed = new Decimal(0);
  }

  getTotalAttack(target: FightingBoss) {
    return this.deployed.mul(this.stats.getPower(target.currentStats!, "Attack", "Defense")).max(new Decimal(0));
  }

  doAttack(target: FightingBoss) {
    target.getAttacked(this.getTotalAttack(target));
  }

  tick(ticksPerSec: number, target: FightingBoss) {
    this.attackCounter = this.attackCounter.add(new Decimal(1).div(ticksPerSec));
    if (this.attackCounter.gte(this.attackTime)) {
      this.attackCounter = new Decimal(0);
      this.doAttack(target);
    }
  }

  deploy_around_boss(boss: FightingBoss) {
    const max_nr = new Decimal(boss.getNrAround(this.size));
    //while there can be units deployed around boss and you have units, do the deploy action
    while (max_nr.gt(this.deployed) && this.units.gt(this.deployed)) {
      boss.deployUnitAround(this);
      this.deployed = this.deployed.add(1);
    }
  }
}

//simualtes a single soldier fighting against a boss
class FightingUnit {
  army: FightingArmy;
  stats: Stats;
  isDead: boolean;
  constructor(army: FightingArmy) {
    this.army = army;
    this.stats = army.stats.add(new Stats([], []));
    this.isDead = false;
  }

  lose_health(damage: Decimal) {
    const lostHealth = this.stats.get<Decimal>("Health").min(damage);
    this.stats.set("Health", this.stats.get<Decimal>("Health").sub(lostHealth));
    this.army.totalHealth = this.army.totalHealth.sub(lostHealth);
    if (this.stats.get<Decimal>("Health").lte(new Decimal(0.00001))) {
      this.die();
    }
  }

  die() {
    this.army.units = this.army.units.sub(1);
    this.army.deployed = this.army.deployed.sub(1);
    this.isDead = true;
  }
}

//simulates a boss fighting against armies represented by the FightingUnits which can get close enough to attack
class FightingBoss {
  stats: Stats;
  maxUnits: Decimal;
  units: Decimal;
  maxTotalHealth: Decimal;
  totalHealth: Decimal;
  attackTime: Decimal;
  attackCounter: Decimal;
  floatingDamage: Decimal;
  moveset: Moveset;
  move?: CombatMove;
  currentStats?: Stats;
  size: number;
  enemiesAround: FightingUnit[];
  targets: number[];
  constructor(boss: Boss) {
    this.stats = boss.stats.add(new Stats([], []));
    this.maxUnits = new Decimal(1);
    this.units = new Decimal(1);
    this.maxTotalHealth = this.units.mul(this.stats.get<Decimal>("Health"));
    this.totalHealth = this.units.mul(this.stats.get<Decimal>("Health"));
    //when attackCounter reaches attackTime, the boss attacks
    this.attackTime = new Decimal(1);
    this.attackCounter = new Decimal(0);
    this.floatingDamage = new Decimal(0);

    this.moveset = boss.moveset;

    this.move = undefined;
    this.currentStats = undefined;
    this.size = boss.size;

    this.enemiesAround = []
    this.targets = []

    this.chooseMove();
  }

  getTargets() {
    this.targets = [];
    if (this.enemiesAround.length == 0) {
      return;
    }
    if ((this.move as unknown as IAttackMove)?.attackTargets) {
      for (let i = 0; (this.move as unknown as IAttackMove).attackTargets.lte(i); i++) {
        const nr = Math.floor(Math.random() * this.enemiesAround.length);
        this.targets.push(nr);
      }
    }
  }

  chooseMove() {
    this.move = this.moveset.getMove();
    this.currentStats = this.move.modifyStats(this.stats);
    this.getTargets();
  }

  getTotalAttack() {
    let attack = new Decimal(0);
    for (let i = 0; i < this.targets.length; i++) {
      attack = attack.add(this.currentStats!.getPower(this.enemiesAround[this.targets[i]].stats, "Attack", "Defense").max(new Decimal(0)));
    }
    return attack;
  }

  doAttack() {
    //attack them
    const dead: number[] = [];
    for (let i = 0; i < this.targets.length; i++) {
      const enemy = this.enemiesAround[this.targets[i]];
      //if the enemy was targeted multiple times, but by now is dead, just roll with it
      if (enemy.isDead) {
        continue;
      }
      const power = this.currentStats!.getPower(enemy.stats, "Attack", "Defense");
      enemy.lose_health(power);
      if (enemy.isDead) {
        //remove enemy from around boss
        dead.push(this.targets[i]);
        //deploy new unit if applicable
        enemy.army.deploy_around_boss(this);
      }
    }
    //remove the dead from the army
    // for (let i = 0; i < dead.length; i++) {
    //   this.enemiesAround[dead[i]] = -1;
    // }
    let i = 0;
    while (i < this.enemiesAround.length) {
      if (this.enemiesAround[i].isDead) {
        this.enemiesAround.splice(i, 1);
      }
      else {
        i++;
      }
    }

    //move feed, maybe move it somewhere else?
    BossFightingPage.feedMoves.push([this, this.moveset.currentMovePlace]);
    if (BossFightingPage.feedMoves.length > BossFightingPage.feedElements.length) {
      BossFightingPage.feedMoves.shift();
    }

    BossFightingPage.update_feed();
    //choose move
    this.chooseMove();
    this.currentStats = this.move!.modifyStats(this.stats);
  }

  tick(ticksPerSec: number) {
    this.attackCounter = this.attackCounter.add(new Decimal(1).div(ticksPerSec));
    if (this.attackCounter.gte(this.attackTime)) {
      this.attackCounter = new Decimal(0);
      this.doAttack();
    }
  }

  getAttacked(power: Decimal) {
    this.totalHealth = this.totalHealth.sub(power);
    this.floatingDamage = this.floatingDamage.add(power);
    const nr_units_dead = this.floatingDamage.div(this.stats.get<Decimal>("Health")).floor();
    if (this.floatingDamage.gte(this.stats.get<Decimal>("Health"))) {
      this.units = this.units.sub(nr_units_dead);
      this.floatingDamage = this.floatingDamage.sub(nr_units_dead.mul(this.stats.get<Decimal>("Health")));
    }
  }
  //a function which calculates how many units can there be around the boss at a given moment
  //works with numbers currently, please change this!
  getNrAround(u_s: number) {
    function isGood(n: number, u_s: number) {
      const x = (n - 2) / (2 * n) * Math.PI;
      if (Math.cos(x) / (1 - Math.cos(x)) >= u_s) {
        return true;
      }
      return false;
    }

    u_s = u_s / this.size;
    let bot = 2, top = this.size * 10;
    let mid = Math.floor((top + bot) / 2);
    while (!isGood(mid, u_s)) {
      top = mid;
      mid = Math.floor((top + bot) / 2);
      if (mid == 2) {
        return 2;
      }
    }
    let last;
    while (isGood(mid, u_s)) {
      last = mid;
      bot = mid;
      mid = Math.floor((top + bot) / 2);
    }
    return last;
  }

  deployUnitAround(army: FightingArmy) {
    this.enemiesAround.push(new FightingUnit(army));
  }
}

class BossSelectArmyButtonsClass extends ButtonGroupClass {
  number: number;
  selected: number;
  buttons: any;
  constructor(containerIdentifier: string, buttonIdentifier: string, selectedStyle: Object, defaultStyle: Object, number: number) {
    containerIdentifier += ".n" + String(number);
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);

    this.number = number;
    this.selected = -1;
  }
  showButton(buttonNr: number) {
    super.showButton(buttonNr);
    this.buttons[buttonNr].hidden = false;
  }
  hideButton(buttonNr: number) {
    super.hideButton(buttonNr);
    this.buttons[buttonNr].hidden = true;
  }
  deselect() {
    if (this.selected != -1) {
      for (const key in this.defaultStyle) {
        //TODO: Investigate Styles
        // this.buttons[this.selected].style[key] = this.defaultStyle[key];
      }
      this.selected = -1;
    }
  }

  buttonClick(buttonNr: number) {
    //reset old armies
    if (BossArmySelectionPage.fight!.selectedArmies[this.number] != -1) {
      for (let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
        if (this.number != k) {
          BossArmySelectionPage.armySelects[k].showButton(buttonNr);
        }
      }
    }
    //if you select the same army again
    if (buttonNr == this.selected) {
      BossArmySelectionPage.fight!.selectedArmies[this.number] = -1;
      BossArmySelectionPage.armyInfos[this.number].innerHTML = "No army to be seen here.";
    }
    //if you selected a new army
    else {
      BossArmySelectionPage.fight!.selectedArmies[this.number] = buttonNr;
      BossArmySelectionPage.armyInfos[this.number].innerHTML = Player.armies[buttonNr].get_fighting_stats_text();
      for (let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
        if (k != this.number) {
          BossArmySelectionPage.armySelects[k].hideButton(buttonNr);
        }
      }
    }

    //do button group things
    if (this.selected == buttonNr) {
      this.deselect();
    }
    else {
      if (this.selected != -1) {
        for (const key in this.defaultStyle) {
          //TODO: Investigate Styles
          // this.buttons[this.selected].style[key] = this.defaultStyle[key];
        }
      }
      this.selectButton(buttonNr);
    }
    BossArmySelectionPage.showHideFightButton();
  }
}
