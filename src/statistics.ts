/*  A module which will store statistical data of your game, such as equipment bought this run and equipment bought overall */

import Decimal from "break_infinity.js";
import { ArmyCompsI, LevelToIndexT, OverallLevelT, StringHashT } from "./types";
import { stuff } from "./data";
import { UH } from "./unlocks";
import { getObjFromPath } from "./functions";

//a class which stores data in a list and conveniently gives access to it as well
//currently has
class StatisticClass {
  static levelToIndex: LevelToIndexT = { 'base': 0 };
  stats: [Decimal];
  overall: Decimal;
  constructor() {
    //each index corresponds to a different level of resets, starting from base to the latest
    this.stats = [new Decimal(0)];
    this.overall = new Decimal(0);
  }
  get type() {
    return 'StatisticClass';
  }
  add(amount: Decimal) {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i] = this.stats[i].add(amount);
    }
    this.overall = this.overall.add(amount);
  }
  setToMax(amount: Decimal) {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i] = this.stats[i].max(amount);
    }
    this.overall = this.overall.max(amount);
  }
  //levels: base, overall
  getStatistics(level: keyof OverallLevelT) {
    if (level == 'overall') {
      return this.overall;
    }
    else {
      return this.stats[StatisticClass.levelToIndex[level]];
    }
  }
  //reset everything except overall number to 0
  reset(level: keyof OverallLevelT) {
    let len = level == 'overall' ? this.stats.length : StatisticClass.levelToIndex[level] + 1;
    for (let i = 0; i < len; i++) {
      this.stats[i] = new Decimal(0);
    }
    if (level == 'overall') {
      this.overall == new Decimal(0);
    }
  }
  save() {
    let saveText = '';
    for (let i = 0; i < this.stats.length; i++) {
      saveText += this.stats[i] + '/*/';
    }
    saveText += this.overall;
    return saveText;
  }
  //returns the new i
  load(saveText: string[], i: number) {
    for (let ii = 0; ii < this.stats.length; ii++) {
      this.stats[ii] = new Decimal(saveText[i]); i++;
    }
    this.overall = new Decimal(saveText[i]); i++;
    return i;
  }
};

//an thisect that stores all statistics under it's stats property
class AllThingsStatisticsClass {
  stats: StringHashT<StatisticClass> = {}
  constructor() {
    this.buildStats();
  }
  setEnd(base: string, elements: []) {
    for (const e in elements) {
      this.stats[base + e] = new StatisticClass();
    }
  }
  buildStats() {
    let base = "StorePage";
    for (const k in Object.keys(stuff)) {
      const key = k as keyof ArmyCompsI<never>;
      for (const subkey in stuff[key]) {
        const finalKey = base + "." + key + "." + subkey;
        this.stats[finalKey] = new StatisticClass();
      }
    }
    base = "Player";
    for (const k in [...Array(Player.armies.length).keys(), 'all']) {
      for (const sk in ["Attack"]) {
        const finalKey = base + ".armies." + k + "." + sk;
        this.stats[finalKey] = new StatisticClass();
      }
    }
    base = "Tower";
    let nrFloors = 2;
    let levelsPerFloor = [9, 12];
    for (let i = 0; i < nrFloors; i++) {
      for (let j = 0; j < levelsPerFloor[i]; j++) {
        for (let k in ["timesVisited"]) {
          const finalKey = base + "." + i + "." + j + "." + k;
          this.stats[finalKey] = new StatisticClass();
        }
      }
    }
  }
  //functions which change statistics, then unlock new stuff if needed
  //they return the value true if an unlock was made, false otherwise
  addToStatistics(path: string[], amount: Decimal) {
    getObjFromPath(path, this.stats).add(amount);
    return UH.doUnlock(path);
  }
  setStatisticsToMax(path: string[], amount: Decimal) {
    getObjFromPath(path, this.stats).setToMax(amount);
    return UH.doUnlock(path);
  }
  getStatistics(path: string[], level: keyof OverallLevelT) {
    return getObjFromPath(path, this.stats).getStatistics(level);
  }
  save() {
    let saveText = String(Object.keys(this.stats).length);
    for (let [key, val] of Object.entries(this.stats)) {
      saveText += '/*/' + key + '/*/' + val.save();
    }
    return saveText;
  }
  load(saveText: string) {
    const saveTextArr = saveText.split('/*/');
    let i = 0;
    let len = Number(saveTextArr[i]); i++;
    let stats = this.stats;
    for (let ii = 0; ii < len; ii++) {
      i = stats[saveTextArr[i]].load(saveTextArr, i + 1)
    }
    return i;
  }
}
export const allThingsStatistics = new AllThingsStatisticsClass();
