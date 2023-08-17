import Decimal from "break_infinity.js";
import { GB } from "./game_body";
import { StorePage } from "./pages/store";
import { allThingsStatistics } from "./statistics";
import { Buyer } from "./store";
import { OverallLevelT, StringHashT } from "./types";
import { ButtonGroupClass } from "./base_classes";
import { getObjFromPath, getPathFromArr } from "./functions";

//logic unlock condition classes
class UnlockConditionLogicClass {
  N: number; // the number of conditions that must be fullfilled
  constructor(N: number) {
    this.N = N;
  }

  countTrueConditions(conditions: UnlockConditionClass[]) {
    let trueConds = 0;
    for (let i = 0; i < conditions.length; i++) {
      trueConds += Number(conditions[i].canUnlock());
    }
    return trueConds;
  }

  canUnlock(conditoins: UnlockConditionClass[]) {
    return true;
  }
};

class AllUCL extends UnlockConditionLogicClass {
  constructor() {
    super(0);
  }
  canUnlock(conditions: UnlockConditionClass[]) {
    return this.countTrueConditions(conditions) == conditions.length;
  }
}

//returns true if at least N of its conditions are true
class AtLeastNUCL extends UnlockConditionLogicClass {
  constructor(N: number) {
    super(N);
  }

  canUnlock(conditions: UnlockConditionClass[]) {
    return this.countTrueConditions(conditions) >= this.N;
  }
};

//when you only need one thing from a list to get an unlock
class AtLeastOneUCL extends AtLeastNUCL {
  constructor() {
    super(1);
  }
}

//returns true if at least N and at most M of its conditions are true
class AtLeastNAtMostMUCL extends UnlockConditionLogicClass {
  M: number;
  constructor(N: number, M: number) {
    super(N);
    this.M = M;
  }

  canUnlock(conditions: UnlockConditionClass[]) {
    let trueConds = this.countTrueConditions(conditions);
    return this.N <= trueConds && trueConds <= this.M;
  }
};

//returns true if exactly N of its conditions are true
class ExactlyNUCL extends UnlockConditionLogicClass {
  constructor(N: number) {
    super(N);
  }

  canUnlock(conditions: UnlockConditionClass[]) {
    return this.N == this.countTrueConditions(conditions);
  }
};

abstract class UnlockConditionClass {
  quantity: Decimal;
  conditionCode: number;
  constructor(quantity: Decimal) {
    this.quantity = quantity;
    this.conditionCode = -1;
  }

  abstract get resetLevel(): keyof OverallLevelT;

  abstract get acronym(): string;

  //a function which dictates if the thing can be unlocked;
  canUnlock() {
    if (this.quantity.lte(allThingsStatistics.getStatistics(this.getPathInStatistics(), this.resetLevel))) {
      return true;
    }
    return false;
  }

  getPathInStatistics(): string[] {
    return [];
  }

  //comparison functions based on quantity
  lt(other: UnlockConditionClass) {
    return this.quantity.lt(other.quantity);
  }
  lte(other: UnlockConditionClass) {
    return this.quantity.lte(other.quantity);
  }
  gt(other: UnlockConditionClass) {
    return this.quantity.gt(other.quantity);
  }
  gte(other: UnlockConditionClass) {
    return this.quantity.gte(other.quantity);
  }
};

class OverallUnlockConditionClass extends UnlockConditionClass {
  constructor(quantity: Decimal) {
    super(quantity);
  }

  get resetLevel() {
    return 'overall' as keyof OverallLevelT;
  }

  get acronym() {
    return 'O';
  }
}

//Specific unlock condition classes come now
//naming: 1-2 words regarding where it is grouped, then where it looks at(O = overall, B = base), then UC for UnlockCondition
//category represents the equipment you want to buy(like Human, Knife, Longsword etc.)
class StorePageOUC extends OverallUnlockConditionClass {
  type: string;
  category: string;
  constructor(type: string, category: string, quantity: Decimal) {
    super(quantity);
    this.type = type;
    this.category = category;
  }

  getPathInStatistics(): string[] {
    return ['StorePage', this.type, this.category];
  }
};

class PlayerArmyOUC extends OverallUnlockConditionClass {
  army: string;
  stat: string;
  constructor(quantity: Decimal, army: string, stat: string) {
    super(quantity);
    this.army = army;
    this.stat = stat;
  }

  getPathInStatistics() {
    return ['Player', 'armies', this.army, this.stat];
  }
};

class TowerLevelOUC extends OverallUnlockConditionClass {
  floor: string;
  level: string;
  constructor(floor: string, level: string) {
    super(new Decimal(1));
    this.floor = floor;
    this.level = level;
  }

  getPathInStatistics() {
    return ['Tower', this.floor + "", this.level + "", 'times_visited'];
  }
};


//base class for unlock thisects; they need the conditions as a list
class UnlockClass {
  conditions: UnlockConditionClass[];
  unlocked: boolean;
  conditionLogic: UnlockConditionLogicClass;
  //conditons = [],
  constructor(conditions: UnlockConditionClass[], contitionLogic: UnlockConditionLogicClass) {
    this.conditions = conditions;
    this.unlocked = false;
    this.conditionLogic = contitionLogic;
  }

  canUnlock() {
    return this.conditionLogic.canUnlock(this.conditions);
  }

  //unlock type dicatates if you want to unlock(1) or lock(0) the current Unlock
  //return true for a successfull unlock, false otherwise
  doUnlock(unlock = true) {
    if (unlock && !this.unlocked) {
      if (this.canUnlock()) {
        this.unlock();
        return true;
      }
      else {
        this.lock();
      }
    }
    return false;
  }

  //unlock feature
  unlock() {
    this.unlocked = true;
  }

  //lock feature (needed for loading and losing in-game progress for whatever reason)
  lock() {
    this.unlocked = false;
  }
};

class PageUnlockClass extends UnlockClass {
  buttonGroup: ButtonGroupClass;
  buttonNr: number;
  constructor(conditions: UnlockConditionClass[], contitionLogic: UnlockConditionLogicClass,
    buttonGroup: ButtonGroupClass, buttonNr: number) {
    super(conditions, contitionLogic);
    this.buttonGroup = buttonGroup;
    this.buttonNr = buttonNr;
  }

  unlock() {
    super.unlock();
    this.buttonGroup.showButton(this.buttonNr);
  }

  lock() {
    super.lock();
    this.buttonGroup.hideButton(this.buttonNr);
  }
};

class NewBuyerUnlockClass extends UnlockClass {
  buyer: Buyer;
  constructor(conditions: UnlockConditionClass[], contitionLogic: UnlockConditionLogicClass,
    buyer: Buyer) {
    super(conditions, contitionLogic);
    this.buyer = buyer;
  }

  unlock() {
    super.unlock();
    StorePage.buyers[this.buyer.type].push(this.buyer);
  }

  lock() {
    super.lock();
    for (let i = 0; i < StorePage.buyers[this.buyer.type]; i++) {
      if (StorePage.buyers[this.buyer.type][i].name == this.buyer.name) {
        StorePage.buyers[this.buyer.type].splice(i, 1);
      }
    }
  }
}

const allThingsUnlockable = {
  'creatures': [],
  'weapons': [
    new NewBuyerUnlockClass([new StorePageOUC('weapons', 'Knife', new Decimal(35))], new AllUCL(), new Buyer('weapons', 'Dagger')),
    new NewBuyerUnlockClass([new StorePageOUC('weapons', 'Dagger', new Decimal(35))], new AllUCL(), new Buyer('weapons', 'Longsword'))
  ],
  'pages': [
    new PageUnlockClass([new StorePageOUC('creatures', 'Human', new Decimal(5))], new AllUCL(), GB.pageButtons, 1),
    new PageUnlockClass([new PlayerArmyOUC(new Decimal(1), 'all', 'Attack')], new AllUCL(), GB.pageButtons, 0),
    new PageUnlockClass([new StorePageOUC('creatures', 'Human', new Decimal(15))], new AllUCL(), StorePage.subpageButtons, 1)
  ],
  'towerFloors': [],
  'towerLevels': [],
}

class UnlockHandlerEntryClass {
  unlocks: UnlockClass[];
  index: number;
  conditionCode: number;
  constructor(conditionCode: number) {
    this.unlocks = [];
    this.index = 0;
    this.conditionCode = conditionCode;
  }

  get type() {
    return 'UnlockHandlerEntryClass';
  }

  doUnlock(unlockType = true) {
    let goOn = true;
    let unlocked = false;
    while (this.index < this.unlocks.length && goOn) {
      goOn = this.unlocks[this.index].doUnlock(unlockType);
      if (goOn) {
        this.index++;
        unlocked = true;
      }
    }
    return unlocked;
  }
  push(unlock: UnlockClass) {
    this.unlocks.push(unlock);
  }
  sort() {
    this.unlocks.sort((a, b) => {
      let condA, condB;
      for (let cond of a.conditions) {
        if (cond.conditionCode == this.conditionCode) {
          condA = cond;
          break;
        }
      }
      for (let cond of b.conditions) {
        if (cond.conditionCode == this.conditionCode) {
          condB = cond;
          break;
        }
      }
      const res = condA!.quantity.sub(condB!.quantity);
      return res.lt_tolerance(0, 0.00001) ? -1 : res.eq_tolerance(0, 0.00001) ? 0 : 1;
    });
  }
  load(index: number) {
    let i = 0;
    for (i; i < index; i++) {
      if (!this.unlocks[i].unlocked) {
        this.unlocks[i].unlock();
      }
    }
    for (i; i < this.unlocks.length; i++) {
      if (this.unlocks[i].unlocked) {
        this.unlocks[i].lock();
      }
    }
    this.index = index;
  }
};

class UnlockHandlerClass {
  static acronyms = ['B', 'O'];
  unlocks: StringHashT<UnlockHandlerEntryClass> = {};
  conditionCode: number;
  // type: string;
  //a list of lists of all unlocks
  constructor() {
    //create each category by path in statistics + unlock level acronym and populate them with the appropriate unlocks
    this.unlocks = {};
    this.conditionCode = 0;
    for (let list of Object.values(allThingsUnlockable)) {
      for (let unlock of list) {
        for (let cond of unlock.conditions) {
          let conditionCode = this.addElementToUnlocks(cond.getPathInStatistics(), cond.acronym, unlock);
          cond.conditionCode = conditionCode;
        }
      }
    }
    //store each category ascending by requirement
    //TODO: Figure out sortUnlocks
    //this.sortUnlocks(this.unlocks);
  }
  get nextConditionCode(): number {
    this.conditionCode++;
    return this.conditionCode - 1;
  }
  addElementToUnlocks(path: string[], acronym: string, unlock: UnlockClass) {
    path.push(acronym);
    const strPath = getPathFromArr(path);
    if (!this.unlocks[strPath]) {
      this.unlocks[strPath] = new UnlockHandlerEntryClass(this.nextConditionCode);
    }
    //add the unlock to correct category
    this.unlocks[strPath].push(unlock);
    return this.unlocks[strPath].conditionCode;
  }
  //get an unlock element from this.unlocks
  getUnlockFromUnlocks(path: string[], acronym: string) {
    path.push(acronym);
    return getObjFromPath(path, this.unlocks);
  }

  doUnlock(path: string[]) {
    for (let acronym of UnlockHandlerClass.acronyms) {
      let elem = this.getUnlockFromUnlocks(path, acronym);
      if (elem != undefined) {
        return elem.doUnlock(true);
      }
    }
  }

  save() {
    let saveText = String(Object.keys(this.unlocks).length);
    for (let [key, val] of Object.entries(this.unlocks)) {
      saveText += '/*/' + key + '/*/' + val.index;
    }
    return saveText;
  }
  load(saveText: string) {
    const saveTextArr = saveText.split('/*/');
    let i = 0;
    let len = Number(saveTextArr[i]); i++;
    let obj = this.unlocks;
    for (let ii = 0; ii < len; ii++) {
      this.unlocks[saveTextArr[i]].load(Number(saveTextArr[i + 1]));
      i += 2;
    }
  }
};

export const UH = new UnlockHandlerClass();