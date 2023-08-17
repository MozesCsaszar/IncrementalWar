import Decimal from "break_infinity.js";
import { Stats, SubStats } from "./stats";
import { stuff } from "./data";
import { IArmyComps } from "./types";

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
  changeElement(type: string, changeTo: string, changeIndex = 0, unlock_stuff = true, army_nr: number) {
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
        ArmyPage.deequipElementByArmy(type, this.creature, army_nr)

        //change the stats of the army
        this.creature = changeTo;

        //equip on ArmyPage

        ArmyPage.equipElementByArmy(type, changeTo, army_nr);
        break;
      case "weapons":

        if (!this.changeElement_helper("weapons", changeTo, changeIndex, unlock_stuff, army_nr)) {
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
  changeElement_helper(type: keyof IArmyComps<never>, changeTo: string, changeIndex = 0, do_shift = true, army_nr = 0) {
    if (!this.canChangeElement(type, changeTo, changeIndex)) {
      return false;
    }
    if (this[type][changeIndex] != "None") {
      Player.inventory[type][this[type][changeIndex]] = Player.inventory[type][this[type][changeIndex]].add(this.size);
    }
    //change stats from old to new
    this.changeStats(type, changeTo, changeIndex);

    //Deequip element from army
    ArmyPage.deequipElementByArmy(type, this[type][changeIndex], army_nr)

    //add in the new one
    this[type][changeIndex] = changeTo;

    //equip element in army
    ArmyPage.equipElementByArmy(type, changeTo, army_nr)

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
  load(saveText, i = 0, army_nr = 0) {
    //split the text by the '/*/'
    if (typeof (saveText) == "string") {
      saveText = saveText.split("/*/");
    }

    //  load the components of the army
    //load the creature
    this.changeElement("creatures", saveText[i], 0, false, army_nr);
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

class SelectionItemListClass extends ItemListClass {
  type: string;
  changeIndex: number;
  elements: any;
  itemList: any;
  container: any;
  previousButton: any;
  nextButton: any;
  //class names come in form of: .<name> or #<name>
  constructor(containerIdentifier, elementIdentifier, previousButtonIdentifier, backButtonIdentifier, next_buttonIdentifier, itemList = []) {
    super(containerIdentifier, elementIdentifier, previousButtonIdentifier, backButtonIdentifier, next_buttonIdentifier, itemList);

    this.type = "creatures";
    this.changeIndex = 0;
  }
  hideElement(elemNr) {
    super.hideElement(elemNr);
    this.elements[elemNr].innerHTML = "";
    this.elements[elemNr].style.borderStyle = "none";
  }
  showElement(elemNr) {
    super.showElement(elemNr);
    this.elements[elemNr].style.borderStyle = "solid";
  }
  elementMouseenter(elemNr) {
    if (this.itemList[elemNr] == "None") {
      ArmyPage.partInfo.innerHTML = "None";
    }
    else {
      ArmyPage.partInfo.innerHTML = stuff[this.type][this.itemList[elemNr]].getText();
    }
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_change_text(this.type, this.itemList[elemNr], this.changeIndex);
  }
  elementMouseleave(elemNr) {
    ArmyPage.partInfo.innerHTML = "";
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].getText();
  }
  elementClick(elemNr) {
    if (!Player.armies[ArmyPage.currentArmy].changeElement(this.type, this.elements[elemNr].innerHTML, this.changeIndex, true, ArmyPage.currentArmy)) {
      return;
    }
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].getText();
    ArmyPage.selectRows[this.type][this.changeIndex][1].innerHTML = this.elements[elemNr].innerHTML;
    if (this.type == "creatures") {
      //hide select rows for weapons and the like
      for (let j = Player.armies[ArmyPage.currentArmy].weapons.length - 1; j > -1; j--) {
        ArmyPage.selectRows.weapons[j][0].parentElement.hidden = true;
        ArmyPage.selectRows.weapons[j][1].innerHTML = "None";
      }
      //show first weapon selection row and the like if the creature is not None
      if (ArmyPage.selectRows.creatures[0][1].innerHTML != "None") {
        ArmyPage.selectRows.weapons[0][0].parentElement.hidden = false;
      }
    }
    else if (this.type == "weapons") {
      let found = false;
      //hide select rows for weapons and the like
      for (let j = 0; j < Player.armies[ArmyPage.currentArmy].weapons.length; j++) {
        if (Player.armies[ArmyPage.currentArmy].weapons[j] == "None") {
          if (found) {
            ArmyPage.selectRows.weapons[j][0].parentElement.hidden = true;
          }
          else {
            found = true;
            ArmyPage.selectRows.weapons[j][0].parentElement.hidden = false;
          }
        }
        ArmyPage.selectRows.weapons[j][1].innerHTML = Player.armies[ArmyPage.currentArmy].weapons[j];
      }
    }

    //hide selection list
    this.container.hidden = true;
    //show management item
    ArmyPage.armyManagerContainer.hidden = false;
  }
  populateElement(elemNr) {
    this.elements[elemNr].innerHTML = this.itemList[this.getItemListIndex(elemNr)];
  }
  backButtonMouseenter() {
    ArmyPage.partInfo.innerHTML = "Take me back, baby!";
  }
  backButtonMouseleave() {
    ArmyPage.partInfo.innerHTML = "";
  }
  backButtonClick() {
    this.hide();
    ArmyPage.armyManagerContainer.hidden = false;
  }
  hidePreviousButton() {
    super.hidePreviousButton();
    this.previousButton.style.borderStyle = "none";
    this.previousButton.innerHTML = ""
  }
  showPreviousButton() {
    super.showPreviousButton();
    this.previousButton.style.borderStyle = "solid";
    this.previousButton.innerHTML = "&lt;"
  }
  hideNextButton() {
    super.hideNextButton();
    this.nextButton.style.borderStyle = "none";
    this.nextButton.innerHTML = ""
  }
  showNextButton() {
    super.showNextButton();
    this.nextButton.style.borderStyle = "solid";
    this.nextButton.innerHTML = "&gt;"
  }

  changeType(type) {
    this.type = type;
  }

  changeSelection(type, itemList) {
    this.changeType(type);
    this.changeItemList(itemList);
  }

  show() {
    super.show(true);
    ArmyPage.armyManagerContainer.hidden = true;
  }
}

class SelectArmyButtonsClass extends ButtonGroupClass {
  constructor(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
  }

  buttonClick(buttonNr) {
    super.buttonClick(buttonNr);
    ArmyPage.changeArmy(buttonNr);
  }
}

class ArmyPageClass extends PageClass {
  currentArmy: any;
  armySizeInput: any;
  partInfo: any;
  info: any;
  selectRows: any;
  armyManagerContainer: any;
  pageButton: any;
  selectRowsTypes: string[];
  selectRowsNrs: number[];
  elementEquipState: { creatures: { None: number; Human: number; }; weapons: { None: number; }; };
  changeArmyButtons: SelectArmyButtonsClass;
  maxArmySizeButton: any;
  elementSelectList: SelectionItemListClass;
  currentSelecting: { weapons: number; };
  levelText: any;
  levelUpButton: any;
  levelUpCost: any;
  timesVisited: number;
  constructor(name) {
    super(name);

    this.pageButton = document.querySelector("#ArmyPageButton");
    this.armyManagerContainer = document.querySelector(".army_management_container");
    this.selectRows = {
      creatures: [],
      weapons: [],
    };
    //the end number of select rows in each category, in order=creatures, weapons
    this.selectRowsTypes = ["creatures", "weapons"];
    this.selectRowsNrs = [1, 9];
    //set up select rows
    const item_rows1 = document.querySelectorAll(".nr_available_div.page_army");
    //      MAYBE NEEDED LATER
    //let item_rows2 = document.querySelectorAll(container_name + ' > ' + list_name + ' > ' + list_item_name + " > .element_name_div");
    const item_rows3 = document.querySelectorAll(".complementary_button.page_army");
    //get them selectRows up & running
    let selectRowsI = 0;
    for (let i = 0; i < item_rows1.length; i++) {
      //change to new type if old one ran out
      if (i >= this.selectRowsNrs[selectRowsI]) {
        selectRowsI++;
      }
      this.selectRows[this.selectRowsTypes[selectRowsI]].push([item_rows1[i], item_rows3[i]]);
    }

    //store equipped state by a bitwise method ( 2 ** army_nr shows if that army equipped the element or not)
    this.elementEquipState = {
      creatures: { "None": 0, "Human": 0, },
      weapons: { "None": 0 },
    };
    this.info = document.querySelector("#ArmyPageInfo");
    this.partInfo = document.querySelector("#ArmyPagePartInfo");
    this.armySizeInput = document.querySelector("#ArmySizeInput");
    this.currentArmy = 0;
    this.changeArmyButtons = new SelectArmyButtonsClass(".select_subpage_container.page_army", ".select_button", { "borderColor": "var(--selected-toggle-button-border-color)" }, { "borderColor": "var(--default-toggle-button-border-color)" });
    this.maxArmySizeButton = document.querySelector("#MaxArmySize");
    this.elementSelectList = new SelectionItemListClass(".element_list.page_army", ".element_list_item", ".element_list_prev_button", ".element_list_back_button", ".element_list_next_button", []);
    this.currentSelecting = {
      weapons: -1,
    };
    this.levelText = document.querySelector("#ArmyLevelText");
    this.levelUpButton = document.querySelector("#ArmyLevelUpButton");
    this.levelUpCost = document.querySelector("#ArmyLevelUpCost");

    this.initializeEventListeners();
  }
  //called when page reloads
  initializeEventListeners() {
    const this = this;

    //initialize all select's, selectButtons parent's and selectButtons' mouse functions
    for (const type in this.selectRows) {
      if (type == "creatures") {
        //select click
        this.selectRows.creatures[0][1].addEventListener("click", () => {
          if (this.elementSelectList.hidden) {
            this.elementSelectList.changeType(type);
            this.elementSelectList.changeItemList(this.generateItemList(type, this.currentArmy));
            this.elementSelectList.changeIndex = 0;
            this.elementSelectList.show();
          }
          else {
            this.selectRows.creatures[0][1].innerHTML = Player.armies[this.currentArmy].creature;
          }
        });
        //selects' parent mouseenter and mouseleave
        this.selectRows.creatures[0][1].addEventListener("mouseenter", () => {
          this.partInfo.innerHTML = stuff.creatures[Player.armies[this.currentArmy].creature].getText();
        });
        this.selectRows.creatures[0][1].addEventListener("mouseleave", () => {
          this.partInfo.innerHTML = "";
        });
      }
      else if (type == "weapons") {
        //selects and their parents
        for (let i = 0; i < 8; i++) {
          //select click
          this.selectRows[type][i][1].addEventListener("click", () => {
            if (this.elementSelectList.hidden) {
              this.elementSelectList.changeType(type);
              this.elementSelectList.changeItemList(this.generateItemList(type, this.currentArmy));
              this.elementSelectList.changeIndex = i;

              this.elementSelectList.show();
            }
            else {
              this.selectRows.weapons[i][1].innerHTML = Player.armies[this.currentArmy].weapons[i];
            }
          });
          //selects' parent mouseenter and mouseleave
          this.selectRows[type][i][1].addEventListener("mouseenter", () => {
            this.partInfo.innerHTML = stuff.weapons[Player.armies[this.currentArmy].weapons[i]].getText();
          });
          this.selectRows[type][i][1].addEventListener("mouseleave", () => {
            this.partInfo.innerHTML = "";
          });
        }
      }
    }

    //army size buttons click functions
    this.armySizeInput.addEventListener("change", () => {
      Player.armies[this.currentArmy].setSize(new Decimal(this.armySizeInput.value));
    });
    this.maxArmySizeButton.addEventListener("click", () => {
      Player.armies[this.currentArmy].setSize(new Decimal(Infinity));
    });

    this.levelUpButton.addEventListener("mouseenter", () => {
      if (Player.armies[this.currentArmy].level < Army.level_prices.length) {
        this.info.innerHTML = Player.armies[this.currentArmy].getLevelUpText();
        this.partInfo.innerHTML = Player.armies[this.currentArmy].getCompareLevelText();
        this.levelText.innerHTML = "Level: " + (Player.armies[this.currentArmy].level + 1) +
          "<span style=\"color:" + UtilityFunctions.getCompareColor(Player.armies[this.currentArmy].level, Player.armies[this.currentArmy].level + 1, false)
          + "\"> &rightarrow; </span>" + (Player.armies[this.currentArmy].level + 2) + "<br>";
      }
    });

    this.levelUpButton.addEventListener("mouseleave", () => {
      this.info.innerHTML = Player.armies[this.currentArmy].getText();
      this.levelText.innerHTML = "Level: " + (Player.armies[this.currentArmy].level + 1) + (Player.armies[this.currentArmy].level >= Army.level_prices.length ? " (Max)" : "");
      this.partInfo.innerHTML = "";
    });

    this.levelUpButton.addEventListener("click", () => {
      Player.armies[this.currentArmy].levelUp();
      this.info.innerHTML = Player.armies[this.currentArmy].getText();

      this.levelText.innerHTML = "Level: " + (Player.armies[this.currentArmy].level + 1);
      if (Player.armies[this.currentArmy].level < Army.level_prices.length) {
        this.info.innerHTML = Player.armies[this.currentArmy].getLevelUpText();
        this.partInfo.innerHTML = Player.armies[this.currentArmy].getCompareLevelText();
        this.levelText.innerHTML = "Level: " + (Player.armies[this.currentArmy].level + 1) +
          "<span style=\"color:" + UtilityFunctions.getCompareColor(Player.armies[this.currentArmy].level, Player.armies[this.currentArmy].level + 1, false)
          + "\">  &rightarrow; </span>" + (Player.armies[this.currentArmy].level + 2) + "<br>";
        this.levelUpCost.innerHTML = "Cost: " + stylizeDecimals(Army.level_prices[Player.armies[this.currentArmy].level]);
      }
      else {
        this.partInfo.innerHTML = "";
        this.levelText.innerHTML = "Level: " + (Player.armies[this.currentArmy].level + 1) + " (Max)";
        this.levelUpButton.hidden = true;
        document.getElementById("ArmyLevelUpCost").hidden = true;
      }
    });
  }
  //called when new save gets loaded
  displayOnLoad() {
    this.info.innerHTML = Player.armies[this.currentArmy].getText();
    this.armySizeInput.value = stylizeDecimals(Player.armies[this.currentArmy].size, true);
  }
  display() {
    //this.changeArmyButtons[this.currentArmy].buttonClick();
    //this.changeArmy(this.currentArmy);
    if (this.timesVisited == 0) {
      TutorialPage.unlockTutorial("Army Page");
      TutorialPage.startTutorial("Army Page", true, "ArmyPage");
    }
    this.timesVisited++;
  }
  displayEveryTick(this) {
    this.selectRows.creatures[0][0].innerHTML = (Player.armies[this.currentArmy].creature == "None" ? "(&infin;)" : "(" + stylizeDecimals(Player.inventory.creatures[Player.armies[this.currentArmy].creature], true) + ")");
    for (i = 0; i < 8; i++) {
      this.selectRows.weapons[i][0].innerHTML = (Player.armies[this.currentArmy].weapons[i] == "None" ? "(&infin;)" : "(" + stylizeDecimals(Player.inventory.weapons[Player.armies[this.currentArmy].weapons[i]], true) + ")");
    }
  }
  //called when a save text is needed
  save() {
    let saveText = super.save();

    //save current army
    saveText += "/*/" + this.currentArmy;
    //save equip state
    saveText += "/*/" + Object.keys(this.elementEquipState).length;
    for (const [tipe, type] of Object.entries(this.elementEquipState)) {
      saveText += "/*/" + Object.keys(type).length + "/*/" + tipe;
      for (const [key, value] of Object.entries(type)) {
        saveText += "/*/" + key + "/*/" + value;
      }
    }

    saveText += "/*/" + this.changeArmyButtons.save();

    return saveText;
  }
  //called when you need to get values from a saveText
  load(saveText) {
    saveText = saveText.split("/*/");
    let i = super.load(saveText);

    //reset color before doing anything else
    this.currentArmy = Number(saveText[i]);
    i++;
    let len_type, len_kv;
    len_type = Number(saveText[i]);
    i++;
    for (let ii = 0; ii < len_type; ii++) {
      len_kv = Number(saveText[i]);
      i++;
      const type = saveText[i]; i++;
      for (let iii = 0; iii < len_kv; iii++) {
        this.elementEquipState[type][saveText[i]] = Number(saveText[i + 1]);
        i += 2;
      }
    }
    i += this.changeArmyButtons.load(saveText, i);
    this.displayOnLoad();
  }
  changeArmy(changeTo) {

    //      reset creature which was used
    this.selectRows.creatures[0][1].innerHTML = Player.armies[changeTo].creature;

    //      reset weapon selects if they where used
    let k = 0;
    while (k < 8 && Player.armies[this.currentArmy].weapons[k] != "None") {
      this.selectRows.weapons[k][1].innerHTML = "None";
      k++;
    }
    //          set new selects and hide selectButtons used
    k = 0;
    this.currentArmy = changeTo;
    //     set setters' innerHTML value
    while (k < 8 && Player.armies[this.currentArmy].weapons[k] != "None") {
      this.selectRows.weapons[k][0].parentElement.hidden = false;
      this.selectRows.weapons[k][1].innerHTML = Player.armies[this.currentArmy].weapons[k];
      k++;
    }
    //          show next selector if possible and needed
    //      set the next weapon selector visible if needed and possible
    if (k < Player.armies[this.currentArmy].maxWeapons && Player.armies[this.currentArmy].creature != "None") {
      this.selectRows.weapons[k][0].parentElement.hidden = false;
      k++;
    }
    //          hide unused selectors
    //      hide unused weapon selectors
    while (k < Player.armies[this.currentArmy].maxWeapons) {
      this.selectRows.weapons[k][0].parentElement.hidden = true;
      k++;
    }
    //          set the info and other stuff
    this.info.innerHTML = Player.armies[changeTo].getText();
    this.armySizeInput.value = stylizeDecimals(Player.armies[changeTo].size, true);
    //set level text
    this.levelText.innerHTML = "Level: " + (Player.armies[this.currentArmy].level + 1);
    if (Player.armies[this.currentArmy].level < Army.level_prices.length) {
      this.levelUpCost.innerHTML = "Cost: " + stylizeDecimals(Army.level_prices[Player.armies[this.currentArmy].level]);

      //show level up stuff
      this.levelUpButton.hidden = false;
      document.getElementById("ArmyLevelUpCost").hidden = false;
    }
    else {
      this.levelText.innerHTML += " (Max)";
      //hide level up stuff
      this.levelUpButton.hidden = true;
      document.getElementById("ArmyLevelUpCost").hidden = true;
    }
    //      if element selection was active, hide it
    if (!this.elementSelectList.hidden) {
      this.elementSelectList.container.hidden = true;
      this.armyManagerContainer.hidden = false;
    }
  }
  equipElementByArmy(type, element, army_nr) {
    if (element != "None") {
      const nr = 2 ** army_nr;
      if (this.elementEquipState[type][element] == undefined) {
        this.elementEquipState[type][element];
      }
      this.elementEquipState[type][element] += nr;
    }
  }
  deequipElementByArmy(type, element, army_nr) {
    if (element != "None") {
      const nr = 2 ** army_nr;
      this.elementEquipState[type][element] -= nr;
    }
  }
  isElementEquippedByArmy(type, element, army_nr) {
    const nr = 2 ** army_nr;
    return Math.floor(this.elementEquipState[type][element] / nr) == 1;
  }
  generateItemList(type, army_nr) {
    const list = []
    for (const element of Object.keys(this.elementEquipState[type])) {
      if (!this.isElementEquippedByArmy(type, element, army_nr)) {
        list.push(element);
      }
    }
    return list;
  }
}

const ArmyPage = new ArmyPageClass("ArmyPage");