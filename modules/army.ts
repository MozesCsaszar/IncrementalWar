import Decimal from "break_infinity.js";
import { Stats, SubStats } from "./stats";
import { stuff } from "./data";
import { IArmyComps } from "./types";
import { Player } from "../IncrementalWar";
import { ItemListClass, ButtonGroupClass } from "./base_classes";
import { stylizeDecimals } from "./functions";


//regular save divider = '/*/'
export class Army implements IArmyComps<string[]> {
  static level_bonuses = [new Decimal(1), new Decimal(1.1), new Decimal(1.2), new Decimal(1.3), new Decimal(1.5), new Decimal(1.7), new Decimal(2)];
  static level_prices = [new Decimal(1000), new Decimal(6000), new Decimal(15000), new Decimal(50000), new Decimal(175000), new Decimal("1e6")];
  creatures: [string];
  weapons: string[];
  _stats: Stats;
  _bodyParts: Stats;
  _size: Decimal;
  level: number;
  level_bonus: Decimal;
  raiding: number;
  power: Decimal;

  constructor(creature = "None", weapons = ["None", "None", "None", "None", "None", "None", "None", "None"], stats = new Stats(), bodyParts = new Stats(), size = new Decimal(0)) {
    this.creatures = [creature];
    this.weapons = weapons;
    this._stats = stats;
    this._bodyParts = bodyParts;
    this._size = size;
    this.level = 0;
    this.level_bonus = new Decimal(1);
    this.raiding = -1;

    this.power = new Decimal(1);
  }
  get creature(): string {
    return this.creatures[0];
  }
  set creature(other: string) {
    this.creatures[0] = other;
  }

  get stats() {
    return this._stats.mul(this.level_bonus);
  }

  set stats(other: Stats) {
    this._stats = other;
  }

  get size() {
    return this._size;
  }

  set size(value) {
    this._size = value;
  }

  get bodyParts() {
    return this._bodyParts;
  }

  set bodyParts(value) {
    this._bodyParts = value;
  }

  get maxWeapons() {
    return 8;
  }

  //the function that decides what to do when a level up is requested
  levelUp() {
    if (this.level < Army.level_prices.length && Army.level_prices[this.level].lt(Player.gold)) {
      Player.gold = Player.gold.sub(Army.level_prices[this.level]);
      this.levelUpHelper();
    }
  }
  //the function that does the level up
  levelUpHelper() {
    this.level++;
    this.level_bonus = this.level_bonus.mul(Army.level_bonuses[this.level]);

  }
  levelDown(toLevel: number) {
    while (this.level > toLevel) {
      this.level_bonus = this.level_bonus.div(Army.level_bonuses[this.level]);
      this.level--;
    }
  }
  getLevelUpText() {
    this.levelUpHelper();
    const new_army = [this.size, this.stats, this.bodyParts]
    this.levelDown(this.level - 1);
    return this.getCompareText(new_army);
  }
  getCompareLevelText() {
    if (this.level >= Army.level_bonuses.length) {
      return "Max level reached, cannot upgrade further, sorry. :)";
    }
    return "Power multiplier: " + stylizeDecimals(this.level_bonus) + "<span style=\"color:" +
      UtilityFunctions.getCompareColor(this.level_bonus, this.level_bonus.mul(Army.level_bonuses[this.level + 1])) + "\"> &rightarrow; </span>" +
      stylizeDecimals(this.level_bonus.mul(Army.level_bonuses[this.level + 1]));
  }
  //helper function to change from one item's stats to the other
  changeStats(type: string, changeTo: string, changeIndex: number) {
    switch (type) {
      case "creatures":
        if (changeTo != "None") {
          this._stats = stuff.creatures[changeTo].stats.add(new Stats([], []));
          this._bodyParts = stuff.creatures[changeTo].bodyParts.add(new Stats([], []));
        }
        else {
          this.stats = this._stats.sub(stuff.creatures[this.creature].stats);
          this._bodyParts = this._bodyParts.sub(stuff[type][this.creature].bodyParts);
        }
        break;
      case "weapons":
        if (this[type][changeIndex] != "None") {
          this._stats = this._stats.sub(stuff[type][this[type][changeIndex]].stats);
          this._bodyParts = this._bodyParts.sub(stuff[type][this[type][changeIndex]].bodyParts);
        }

        if (changeTo != "None") {
          this._stats = this._stats.add(stuff[type][changeTo].stats);
          this._bodyParts = this._bodyParts.add(stuff[type][changeTo].bodyParts);
        }
        break;
    }
  }
  //REVAMP FROM HERE
  changeElement(type: string, changeTo: string, changeIndex = 0, unlock_stuff = true, armyNr: number) {
    //if we are talking about a creature, then the change is big
    switch (type) {
      case "creatures":
        //reset the size of the army
        this.setSize(new Decimal(0));

        //and remove elements and refund their costs
        for (let i = this.weapons.length - 1; i > -1; i--) {
          this.changeElement("weapons", "None", i, unlock_stuff);
        }

        //change stats from old to new
        this.changeStats(type, changeTo, changeIndex);

        //Deequip creature from army
        ArmyPage.deequipElementByArmy(type, this.creature, armyNr)

        //change the stats of the army
        this.creature = changeTo;

        //equip on ArmyPage

        ArmyPage.equipElementByArmy(type, changeTo, armyNr);
        break;
      case "weapons":

        if (!this.changeElement_helper("weapons", changeTo, changeIndex, unlock_stuff, armyNr)) {
          console.log("here");
          return false;
        }
        break;
    }
    //send unlock request after change
    if (unlock_stuff) {
      allThingsStatistics.setStatisticsToMax(["Player", "armies", ArmyPage.currentArmy, "Attack"], this.stats.get<SubStats>("Attack").getPlainPower());
      allThingsStatistics.setStatisticsToMax(["Player", "armies", "all", "Attack"], this.stats.get<SubStats>("Attack").getPlainPower());
    }
    return true;
  }
  //CHANGE STUFF TO WORK FOR EVERYTHING TOGETHER, NOT CREATURES AND OTHER STUFF TREATED AS DIFFERENT CASES
  canChangeElement(type: keyof IArmyComps<never>, element: string, index: number) {
    if (type == "creatures" || element == "None") {
      return true;
    }
    else {
      let temp_s = undefined;
      let temp_b = undefined;
      if (this[type][index] != "None") {
        this._stats = this._stats.sub(stuff[type][this[type][index]].stats);
        this._bodyParts = this._bodyParts.sub(stuff[type][this[type][index]].bodyParts);
        temp_s = this.stats;
        temp_b = this.bodyParts;
        this._stats = this._stats.add(stuff[type][this[type][index]].stats);
        this._bodyParts = this._bodyParts.add(stuff[type][this[type][index]].bodyParts);
      }
      else {
        temp_s = this.stats;
        temp_b = this.bodyParts;
      }
      if (temp_b.add(stuff[type][element].bodyParts).gte(0)) {
        if (stuff[type][element].requires.lte(temp_s)) {
          if (temp_s.get<Decimal>("Health").gt(0)) {
            return true;
          }
        }
      }
      return false;
    }
  }
  //helps to change the stuff that is not creature in your army
  changeElement_helper(type: keyof IArmyComps<never>, changeTo: string, changeIndex = 0, do_shift = true, armyNr = 0) {
    if (!this.canChangeElement(type, changeTo, changeIndex)) {
      return false;
    }
    if (this[type][changeIndex] != "None") {
      Player.inventory[type][this[type][changeIndex]] = Player.inventory[type][this[type][changeIndex]].add(this.size);
    }
    //change stats from old to new
    this.changeStats(type, changeTo, changeIndex);

    //Deequip element from army
    ArmyPage.deequipElementByArmy(type, this[type][changeIndex], armyNr)

    //add in the new one
    this[type][changeIndex] = changeTo;

    //equip element in army
    ArmyPage.equipElementByArmy(type, changeTo, armyNr)

    //maybe display (/ remove the ones you cannot) just the ones you can use (handcount and the stuff)
    if (changeTo != "None") {
      //set new size of the army to if the number of this item is less than the size of the army min(size, number of new item)
      Player.inventory[type][changeTo] = Player.inventory[type][changeTo].sub(this.size);

      if (this.size > Player.inventory[type][changeTo]) {
        this.setSize(this.size.add(Player.inventory[type][changeTo]));
      }
    }

    //if changed to 'None' and weapon shifting is necessary
    else if (changeTo == "None" && do_shift) {
      let i = changeIndex;
      //shift the elements to the left by one unit
      while (i < this.maxWeapons - 1 && this[type][i + 1] != "None") {
        this[type][i] = this[type][i + 1];
        this[type][i + 1] = "None";
        i++;
      }
    }
    return true;
  }
  setSize(new_size) {
    //if the creature is 'None', then there can be no army
    if (this.creature == "None" || new_size.lt(new Decimal(0))) {
      return;
    }
    //calculate the minimun of the elements which are available
    let minn = (new_size.sub(this.size)).min(Player.inventory.creatures[this.creature]);
    let i = 0;
    while (this.weapons[i] != "None") {
      minn = minn.min(Player.inventory.weapons[this.weapons[i]]);
      i++;
    }
    //set new size
    this.size = minn.add(this.size);
    //set new values for the inventory of items used
    Player.inventory.creatures[this.creature] = Player.inventory.creatures[this.creature].sub(minn);
    i = 0;
    while (this.weapons[i] != "None") {
      Player.inventory.weapons[this.weapons[i]] = Player.inventory.weapons[this.weapons[i]].sub(minn);
      i++;
    }
    //give visual feedback on what you have here

    ArmyPage.armySizeInput.value = stylizeDecimals(this.size, true);
  }
  get_stats_text() {
    return this.stats.getText() + "<br>" + this.bodyParts.getText(true);
  }
  get_change_text(type, changeTo, changeIndex = 0) {
    //if you reset your creature, show this text
    let changed = undefined;
    if (type == "creatures") {
      if (changeTo == "None") {
        return "You would dismantle your army with this action.";
      }
      changed = this.creature;
    }
    else {
      changed = this[type][changeIndex];
    }
    //let size = this._size;
    //change element then change it back to view changes
    if (this.canChangeElement(type, changeTo, changeIndex)) {
      let new_army = undefined
      switch (type) {
        case "creatures":
          this.changeStats(type, changeTo, changeIndex);
          this.creature = changeTo;
          new_army = [this.size.min(Player.inventory[type][changeTo]), this.stats, this.bodyParts];
          this.changeStats(type, changed, changeIndex);
          this.creature = changed;
          break;
        case "weapons":
          this.changeStats(type, changeTo, changeIndex);
          this[type][changeIndex] = changeTo;
          new_army = [this.size.min(Player.inventory[type][changeTo]), this.stats, this.bodyParts];
          this.changeStats(type, changed, changeIndex);
          this[type][changeIndex] = changed;
          break;
      }
      return this.getCompareText(new_army);
    }
    return "Cannot change this element of your army, sorry!";
  }
  //helper function to get_change_text
  getCompareText(new_army) {
    if (!Array.isArray(new_army)) {
      new_army = [new_army.size, new_army.stats, new_army.bodyParts];
    }
    let text = "Size: " + stylizeDecimals(this.size, true) + "<span style=\"color:" + UtilityFunctions.getCompareColor(this.size, new_army[0]) + ";\"> &rightarrow; </span>" +
      stylizeDecimals(new_army[0], true) + "<br>";
    text += this.stats.getCompareText(new_army[1]) + "<br>";
    text += this.bodyParts.getCompareText(new_army[2]);
    return text;
  }

  getText(with_size = false) {
    if (this.creature == "None") {
      return "An army without a creature is nothing. You can't fight with it, nor do anything with it. Just sayin'. So please buy some creatures and make an army with them before anything else.";
    }
    let text = "";
    if (with_size == true) {
      text = "Army size: " + stylizeDecimals(this.size, true) + "<br>";
    }
    else {
      text += "<br>";
    }
    text += this.get_stats_text() + "<br>";
    return text;
  }
  get_fighting_stats_text() {
    if (this.creature == "None") {
      return "No army to be seen here.";
    }
    let text = "";
    text = "Army size: " + stylizeDecimals(this.size, true) + "<br>";
    text += "Collective health: " + stylizeDecimals(this.size.mul(this.stats["Health"]), true) + "<br>";
    text += this.stats.getText();
    return text;
  }
  save() {
    //  save the components of the army
    //save the creature
    let saveText = this.creature + "/*/";
    //save the weapons
    saveText += this.weapons.length;
    for (let i = 0; i < this.weapons.length; i++) {
      saveText += "/*/" + this.weapons[i];
    }
    //  save the size
    saveText += "/*/" + this._size;
    //save the tower level which this army is raiding
    saveText += "/*/" + this.raiding;
    saveText += "/*/" + this.level + "/*/" + this.level_bonus;
    return saveText;
  }
  load(saveText, i = 0, armyNr = 0) {
    //split the text by the '/*/'
    if (typeof (saveText) == "string") {
      saveText = saveText.split("/*/");
    }

    //  load the components of the army
    //load the creature
    this.changeElement("creatures", saveText[i], 0, false, armyNr);
    i++;
    let j = new Number(saveText[i]);
    i++;
    let k = 0;
    //load the weapons
    while (j > 0) {
      this.changeStats("weapons", saveText[i], k);
      this.weapons[k] = saveText[i];

      j--;
      i++;
      k++;
    }
    //  load the size
    this.size = new Decimal(saveText[i]);
    i++;
    this.raiding = Number(saveText[i]);
    i++;
    this.level = Number(saveText[i]);
    i++;
    this.level_bonus = new Decimal(saveText[i]);
    i++;
    return i;
  }
}