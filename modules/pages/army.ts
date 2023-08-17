import Decimal from "break_infinity.js";
import { Player } from "../main";
import { Army } from "../army";
import { ButtonGroupClass, ItemListClass, PageClass } from "../base_classes";
import { stuff } from "../data";
import { getCompareColor, getHtmlElement, getHtmlElementList, stylizeDecimals } from "../functions";
import { ArmyCompsI, StringHashT } from "../types";

class SelectArmyButtonsClass extends ButtonGroupClass {
  constructor(containerIdentifier: string, buttonIdentifier: string, selectedStyle: Object, defaultStyle: Object) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
  }

  buttonClick(buttonNr: number) {
    super.buttonClick(buttonNr);
    ArmyPage.changeArmy(buttonNr);
  }
}

//TODO: Figure out what kind of ItemList this is
class SelectionItemListClass extends ItemListClass<string> {
  type: keyof ArmyCompsI<never>;
  changeIndex: number;
  //class names come in form of: .<name> or #<name>
  constructor(containerIdentifier: string, elementIdentifier: string,
    previousButtonIdentifier: string, backButtonIdentifier: string,
    next_buttonIdentifier: string, itemList = []) {
    super(containerIdentifier, elementIdentifier, previousButtonIdentifier, backButtonIdentifier, next_buttonIdentifier, itemList);

    this.type = "creatures";
    this.changeIndex = 0;
  }
  hideElement(elemNr: number) {
    super.hideElement(elemNr);
    this.elements[elemNr].innerHTML = "";
    this.elements[elemNr].style.borderStyle = "none";
  }
  showElement(elemNr: number) {
    super.showElement(elemNr);
    this.elements[elemNr].style.borderStyle = "solid";
  }
  elementMouseenter(elemNr: number) {
    if (this.itemList[elemNr] == "None") {
      ArmyPage.partInfo.innerHTML = "None";
    }
    else {
      ArmyPage.partInfo.innerHTML = stuff[this.type][this.itemList[elemNr]].getText();
    }
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].get_change_text(this.type, this.itemList[elemNr], this.changeIndex);
  }
  elementMouseleave(elemNr: number) {
    ArmyPage.partInfo.innerHTML = "";
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].getText();
  }
  elementClick(elemNr: number) {
    if (!Player.armies[ArmyPage.currentArmy].changeElement(this.type, this.elements[elemNr].innerHTML, this.changeIndex, true, ArmyPage.currentArmy)) {
      return;
    }
    ArmyPage.info.innerHTML = Player.armies[ArmyPage.currentArmy].getText();
    ArmyPage.selectRows[this.type][this.changeIndex][1].innerHTML = this.elements[elemNr].innerHTML;
    if (this.type == "creatures") {
      //hide select rows for weapons and the like
      for (let j = Player.armies[ArmyPage.currentArmy].weapons.length - 1; j > -1; j--) {
        ArmyPage.selectRows.weapons[j][0].parentElement!.hidden = true;
        ArmyPage.selectRows.weapons[j][1].innerHTML = "None";
      }
      //show first weapon selection row and the like if the creature is not None
      if (ArmyPage.selectRows.creatures[0][1].innerHTML != "None") {
        ArmyPage.selectRows.weapons[0][0].parentElement!.hidden = false;
      }
    }
    else if (this.type == "weapons") {
      let found = false;
      //hide select rows for weapons and the like
      for (let j = 0; j < Player.armies[ArmyPage.currentArmy].weapons.length; j++) {
        if (Player.armies[ArmyPage.currentArmy].weapons[j] == "None") {
          if (found) {
            ArmyPage.selectRows.weapons[j][0].parentElement!.hidden = true;
          }
          else {
            found = true;
            ArmyPage.selectRows.weapons[j][0].parentElement!.hidden = false;
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
  populateElement(elemNr: number) {
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

  changeType(type: string) {
    this.type = type as keyof ArmyCompsI<never>;
  }

  changeSelection(type: string, itemList: string[]) {
    this.changeType(type);
    this.changeItemList(itemList);
  }

  show() {
    super.show(true);
    ArmyPage.armyManagerContainer.hidden = true;
  }
}

class ArmyPageClass extends PageClass {
  currentArmy: number = 0;
  armySizeInput: HTMLInputElement = getHtmlElement("#ArmySizeInput") as HTMLInputElement;
  partInfo: HTMLElement = getHtmlElement("#ArmyPagePartInfo");
  info: HTMLElement = getHtmlElement("#ArmyPageInfo");
  selectRows: ArmyCompsI<[HTMLElement, HTMLElement][]>;
  armyManagerContainer: HTMLElement = getHtmlElement(".army_management_container");
  pageButton: HTMLElement = getHtmlElement("#ArmyPageButton");
  selectRowsTypes: string[];
  selectRowsNrs: number[];
  elementEquipState: ArmyCompsI<StringHashT<number>>;
  changeArmyButtons: SelectArmyButtonsClass;
  maxArmySizeButton: HTMLElement = getHtmlElement("#MaxArmySize");
  elementSelectList: SelectionItemListClass;
  currentSelecting: { weapons: number; };
  levelText: HTMLElement = getHtmlElement("#ArmyLevelText");
  levelUpButton: HTMLElement = getHtmlElement("#ArmyLevelUpButton");
  levelUpCost: HTMLElement = getHtmlElement("#ArmyLevelUpCost");
  timesVisited: number = 0;
  constructor(name: string) {
    super(name);

    this.selectRows = {
      creatures: [],
      weapons: [],
    };
    //the end number of select rows in each category, in order=creatures, weapons
    this.selectRowsTypes = ["creatures", "weapons"];
    this.selectRowsNrs = [1, 9];
    //set up select rows
    const item_rows1 = getHtmlElementList(".nr_available_div.page_army");
    //      MAYBE NEEDED LATER
    //let item_rows2 = document.querySelectorAll(container_name + ' > ' + list_name + ' > ' + list_item_name + " > .element_name_div");
    const item_rows3 = getHtmlElementList(".complementary_button.page_army");
    //get them selectRows up & running
    let selectRowsI = 0;
    let row = this.selectRowsTypes[selectRowsI] as keyof ArmyCompsI<never>;
    for (let i = 0; i < item_rows1.length; i++) {
      //change to new type if old one ran out
      if (i >= this.selectRowsNrs[selectRowsI]) {
        selectRowsI++;
        row = this.selectRowsTypes[selectRowsI] as keyof ArmyCompsI<never>;
      }
      this.selectRows[row].push([item_rows1[i], item_rows3[i]]);
    }

    //store equipped state by a bitwise method ( 2 ** armyNr shows if that army equipped the element or not)
    this.elementEquipState = {
      creatures: { "None": 0, "Human": 0, },
      weapons: { "None": 0 },
    };
    this.changeArmyButtons = new SelectArmyButtonsClass(".select_subpage_container.page_army", ".select_button", { "borderColor": "var(--selected-toggle-button-border-color)" }, { "borderColor": "var(--default-toggle-button-border-color)" });
    this.elementSelectList = new SelectionItemListClass(".element_list.page_army", ".element_list_item", ".element_list_prev_button", ".element_list_back_button", ".element_list_next_button", []);
    this.currentSelecting = {
      weapons: -1,
    };

    this.initializeEventListeners();
  }
  //called when page reloads
  initializeEventListeners() {
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
          "<span style=\"color:" + getCompareColor(Player.armies[this.currentArmy].level, Player.armies[this.currentArmy].level + 1)
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
          "<span style=\"color:" + getCompareColor(Player.armies[this.currentArmy].level, Player.armies[this.currentArmy].level + 1)
          + "\">  &rightarrow; </span>" + (Player.armies[this.currentArmy].level + 2) + "<br>";
        this.levelUpCost.innerHTML = "Cost: " + stylizeDecimals(Army.level_prices[Player.armies[this.currentArmy].level]);
      }
      else {
        this.partInfo.innerHTML = "";
        this.levelText.innerHTML = "Level: " + (Player.armies[this.currentArmy].level + 1) + " (Max)";
        this.levelUpButton.hidden = true;
        getHtmlElement("#ArmyLevelUpCost").hidden = true;
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
  displayEveryTick() {
    this.selectRows.creatures[0][0].innerHTML = (Player.armies[this.currentArmy].creature == "None" ? "(&infin;)" : "(" + stylizeDecimals(Player.inventory.creatures[Player.armies[this.currentArmy].creature], true) + ")");
    for (let i = 0; i < 8; i++) {
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
  load(saveText: string) {
    const saveTextArr = saveText.split("/*/");
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
        this.elementEquipState[type as keyof ArmyCompsI<never>][saveText[i]] = Number(saveText[i + 1]);
        i += 2;
      }
    }
    i += this.changeArmyButtons.load(saveText, i);
    this.displayOnLoad();
    return i;
  }
  changeArmy(changeTo: number) {

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
      this.selectRows.weapons[k][0].parentElement!.hidden = false;
      this.selectRows.weapons[k][1].innerHTML = Player.armies[this.currentArmy].weapons[k];
      k++;
    }
    //          show next selector if possible and needed
    //      set the next weapon selector visible if needed and possible
    if (k < Player.armies[this.currentArmy].maxWeapons && Player.armies[this.currentArmy].creature != "None") {
      this.selectRows.weapons[k][0].parentElement!.hidden = false;
      k++;
    }
    //          hide unused selectors
    //      hide unused weapon selectors
    while (k < Player.armies[this.currentArmy].maxWeapons) {
      this.selectRows.weapons[k][0].parentElement!.hidden = true;
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
      getHtmlElement("#ArmyLevelUpCost").hidden = false;
    }
    else {
      this.levelText.innerHTML += " (Max)";
      //hide level up stuff
      this.levelUpButton.hidden = true;
      getHtmlElement("#ArmyLevelUpCost").hidden = true;
    }
    //      if element selection was active, hide it
    if (!this.elementSelectList.hidden) {
      this.elementSelectList.container.hidden = true;
      this.armyManagerContainer.hidden = false;
    }
  }
  equipElementByArmy(type: keyof ArmyCompsI<never>, element: string, armyNr: number) {
    if (element != "None") {
      const nr = 2 ** armyNr;
      if (this.elementEquipState[type][element] == undefined) {
        this.elementEquipState[type][element];
      }
      this.elementEquipState[type][element] += nr;
    }
  }
  deequipElementByArmy(type: keyof ArmyCompsI<never>, element: string, armyNr: number) {
    if (element != "None") {
      const nr = 2 ** armyNr;
      this.elementEquipState[type][element] -= nr;
    }
  }
  isElementEquippedByArmy(type: keyof ArmyCompsI<never>, element: string, armyNr: number) {
    const nr = 2 ** armyNr;
    return Math.floor(this.elementEquipState[type][element] / nr) == 1;
  }
  generateItemList(type: keyof ArmyCompsI<never>, armyNr: number) {
    const list = []
    for (const element of Object.keys(this.elementEquipState[type])) {
      if (!this.isElementEquippedByArmy(type, element, armyNr)) {
        list.push(element);
      }
    }
    return list;
  }
}

export const ArmyPage = new ArmyPageClass("ArmyPage");