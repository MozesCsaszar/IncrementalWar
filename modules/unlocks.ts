class UnlockConditionClass {
  constructor(quantity) {
    this.quantity = quantity;
    this.conditionCode = undefined;
  }

  //a function which dictates if the thing can be unlocked;
  canUnlock() {
    if (this.quantity.lte(allThingsStatistics.getStatistics(this.getPathInStatistics(), this.level))) {
      return true;
    }
    return false;
  }

  getPathInStatistics() {
    return [];
  }

  //comparison functions based on quantity
  lt(other) {
    return this.quantity.lt(other.quantity);
  }
  lte(other) {
    return this.quantity.lte(other.quantity);
  }
  gt(other) {
    return this.quantity.gt(other.quantity);
  }
  gte(other) {
    return this.quantity.gte(other.quantity);
  }
};

//logic unlock condition classes

class UnlockConditionLogic {
  constructor(N) {
    this.N = N;
  }

  countTrueConditions(conditions) {
    let true_conds = 0;
    for (let i = 0; i < conditions.length; i++) {
      true_conds += conditions[i].canUnlock();
    }
    return true_conds;
  }
};

class AllUCL extends UnlockConditionLogic {
  constructor(N) {
    super(N);
  }
  canUnlock(conditions) {
    return this.countTrueConditions(conditions) == conditions.length;
  }
}

//returns true if at least N of its conditions are true
class AtLeastNUCL extends UnlockConditionLogic {
  constructor(N) {
    super(N);
  }

  canUnlock(conditions) {
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
class AtLeastNAtMostMUCL extends UnlockConditionLogic {
  constructor(conditions, N, M) {
    super(conditions, N);
    this.M = M;
  }

  canUnlock(conditions) {
    let true_conds = this.countTrueConditions(conditions);
    return this.N <= true_conds && true_conds <= this.M;
  }
};

//returns true if exactly N of its conditions are true
class ExactlyNUCL extends UnlockConditionLogic {
  constructor(conditions, N) {
    super(conditions, N);
  }

  canUnlock(conditions) {
    return this.N == this.countTrueConditions(conditions);
  }
};



//a series of unlock condition classes based on the level at which they check the statistics
class BaseUnlockConditionClass extends UnlockConditionClass {
  constructor(quantity) {
    super(quantity);
  }

  get level() {
    return 'overall';
  }

  get acronym() {
    return 'B';
  }
}

class OverallUnlockConditionClass extends UnlockConditionClass {
  constructor(quantity) {
    super(quantity);
  }

  get level() {
    return 'overall';
  }

  get acronym() {
    return 'O';
  }
}

//Specific unlock condition classes come now
//naming: 1-2 words regarding where it is grouped, then where it looks at(O = overall, B = base), then UC for UnlockCondition
//category represents the equipment you want to buy(like Human, Knife, Longsword etc.)
class StorePageOUC extends OverallUnlockConditionClass {
  constructor(type, category, quantity) {
    super(quantity);
    this.type = type;
    this.category = category;
  }

  getPathInStatistics() {
    return ['StorePage', this.type, this.category];
  }
};

class PlayerArmyOUC extends OverallUnlockConditionClass {
  constructor(quantity, army, stat) {
    super(quantity);
    this.army = army;
    this.stat = stat;
  }

  getPathInStatistics() {
    return ['Player', 'armies', this.army, this.stat];
  }
};

class TowerLevelOUC extends OverallUnlockConditionClass {
  constructor(floor, level) {
    super(new Decimal(1));
    this.floor = floor;
    this.level = level;
  }

  getPathInStatistics() {
    return ['Tower', this.floor, this.level, 'times_visited'];
  }
};


//base class for unlock thisects; they need the conditions as a list
class UnlockClass {
  //conditons = [],
  constructor(conditions, condition_logic) {
    this.conditions = conditions;
    this.unlocked = 0;
    this.conditionLogic = condition_logic;
  }

  canUnlock() {
    return this.conditionLogic.canUnlock(this.conditions);
  }

  //unlock type dicatates if you want to unlock(1) or lock(0) the current Unlock
  //return true for a successfull unlock, false otherwise
  doUnlock(unlock_type = 1) {
    if (!this.unlocked == unlock_type) {
      if (unlock_type == 1) {
        if (this.canUnlock()) {
          this.unlock();
          return true;
        }
      }
      else {
        this.lock();
      }
    }
    return false;
  }

  //unlock feature
  unlock() {
    this.unlocked = 1;
  }

  //lock feature (needed for loading and losing in-game progress for whatever reason)
  lock() {
    this.unlocked = 0;
  }

  //return a certain condition based on type
  getCondition(type) {
    for (let cond of this.conditions) {
      if (cond.type == type) {
        return cond;
      }
    }
    return undefined;
  }
};

class PageUnlockClass extends UnlockClass {
  constructor(conditions, condition_logic, button_group, buttonNr) {
    super(conditions, condition_logic);
    this.buttonGroup = button_group;
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
  constructor(conditions, condition_logic, buyer) {
    super(conditions, condition_logic);
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
  'weapons': [new NewBuyerUnlockClass([new StorePageOUC('weapons', 'Knife', new Decimal(35))], new AllUCL(), new Buyer('weapons', 'Dagger')),
  new NewBuyerUnlockClass([new StorePageOUC('weapons', 'Dagger', new Decimal(35))], new AllUCL(), new Buyer('weapons', 'Longsword'))],
  'pages': [new PageUnlockClass([new StorePageOUC('creatures', 'Human', new Decimal(5))], new AllUCL(), GB.pageButtons, 1),
  new PageUnlockClass([new PlayerArmyOUC(new Decimal(1), 'all', 'Attack')], new AllUCL(), GB.pageButtons, 0),
  new PageUnlockClass([new StorePageOUC('creatures', 'Human', new Decimal(15))], new AllUCL(), StorePage.subpageButtons, 1)],
  'towerFloors': [],
  'towerLevels': [],
}

class UnlockHandlerEntryClass {
  constructor(condition_code) {
    this.unlocks = [];
    this.index = 0;
    this.conditionCode = condition_code;
  }

  get type() {
    return 'UnlockHandlerEntryClass';
  }

  doUnlock(unlock_type = 1) {
    let go_on = true;
    let unlocked = false;
    while (this.index < this.unlocks.length && go_on) {
      go_on = this.unlocks[this.index].doUnlock(unlock_type);
      if (go_on) {
        this.index++;
        unlocked = true;
      }
    }
    return unlocked;
  }

  push(this) {
    this.unlocks.push(this);
  }
  sort() {
        let this = this;
    this.unlocks.sort(function (a, b) {
      let cond_a, cond_b;
      for (let cond of a.conditions) {
        if (cond.conditionCode == this.conditionCode) {
          cond_a = cond;
          break;
        }
      }
      for (let cond of b.conditions) {
        if (cond.conditionCode == this.conditionCode) {
          cond_b = cond;
          break;
        }
      }
      return cond_a.quantity.sub(cond_b.quantity);
    });
  }
  load(index) {
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
  //a list of lists of all unlocks
  constructor() {
    //create each category by path in statistics + unlock level acronym and populate them with the appropriate unlocks
    this.unlocks = {};
    this.nextConditionCode = 0;
    for (let list of Object.values(allThingsUnlockable)) {
      for (let unlock of list) {
        for (let cond of unlock.conditions) {
          let condition_code = this.addElementToUnlocks(cond.getPathInStatistics(), cond.acronym, unlock);
          cond.conditionCode = condition_code;
        }
      }
    }
    //store each category ascending by requirement
    this.sortUnlocks(this.unlocks);
  }
  addElementToUnlocks(path, acronym, unlock) {
    //get to the right place in this.unlocks and add parts if they are not yet existent
    let stats = this.unlocks;
    for (let elem of path) {
      if (stats[elem] == undefined) {
        stats[elem] = {};
      }
      stats = stats[elem];
    }
    //if the last destination doesn't exist, just add it
    if (stats[acronym] == undefined) {
      stats[acronym] = new UnlockHandlerEntryClass(this.nextConditionCode);
      this.nextConditionCode++;
    }
    //add the unlock to correct category
    stats[acronym].push(unlock);
    return stats[acronym].conditionCode;
  }
  //sorts thisect by calling sortUnlocks on each key that result in an thisect and sort on each array found
  sortUnlocks(this) {
    for (let value of Object.values(this)) {
      if (this.type == 'UnlockHandlerEntryClass') {
        this.sort();
      }
      else {
        this.sortUnlocks(value);
      }
    }
  }
  //get an unlock element from this.unlocks
  getUnlockFromUnlocks(path, acronym) {
    let stats = this.unlocks;
    for (let elem of path) {
      if (stats[elem] == undefined) {
        return undefined;
      }
      stats = stats[elem];
    }
    if (stats == undefined) {
      return stats;
    }
    return stats[acronym];
  }

  doUnlock(path) {
    for (let acronym of UnlockHandlerClass.acronyms) {
      let elem = this.getUnlockFromUnlocks(path, acronym);
      if (elem != undefined) {
        return elem.doUnlock(1);
      }
    }
  }
  saveRecursive(this) {
    let saveText = String(Object.keys(this).length);
    for (let [key, val] of Object.entries(this)) {
      if (val.type == 'UnlockHandlerEntryClass') {
        saveText += '/*/' + key + '/*/' + val.index;
      }
      else {
        saveText += '/*/' + key + '/*/' + this.saveRecursive(val);
      }
    }
    return saveText;
  }

  save() {
    let saveText = String(Object.keys(this.unlocks).length);
    for (let [key, val] of Object.entries(this.unlocks)) {
      saveText += '/*/' + key + '/*/' + this.saveRecursive(val);
    }
    return saveText;
  }
  //returns the value of i (the index in saveText we are currently scrying for information)
  loadRecursive(saveText, this, i) {
    let len = Number(saveText[i]); i++;
    if (this.type == 'UnlockHandlerEntryClass') {
      this.load(len);
    }
    else {
      for (let ii = 0; ii < len; ii++) {
        i = this.loadRecursive(saveText, this[saveText[i]], i + 1);
      }
    }
    return i;
  }
  load(saveText) {
    saveText = saveText.split('/*/');
    let i = 0;
    let len = Number(saveText[i]); i++;
        let this = this.unlocks;
    for (let ii = 0; ii < len; ii++) {
      i = this.loadRecursive(saveText, this[saveText[i]], i + 1);
    }
  }
};

let UH = new UnlockHandlerClass();