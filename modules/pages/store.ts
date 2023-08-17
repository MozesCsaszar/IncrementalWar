//          BUY CREATURE PAGE

import Decimal from "break_infinity.js";
import { Player } from "../main";
import { ItemListClass, ButtonGroupClass, PageClass } from "../base_classes";
import { stuff } from "../data";
import { getHtmlElementList, stylizeDecimals } from "../functions";
import { ArmyCompsI } from "../types";
import { Buyer } from "../store";
import { TutorialPage } from "./tutorial";

class StoreItemListClass extends ItemListClass<Buyer> {
  type: keyof ArmyCompsI<never>;
  buyerRows: [HTMLElement, HTMLElement, HTMLElement][] = [];
  //class names come in form of: .<name> or #<name>
  constructor(containerIdentifier: string, elementIdentifier: string,
    previousButtonIdentifier: string, backButtonIdentifier: string,
    next_buttonIdentifier: string, itemList = []) {
    super(containerIdentifier, elementIdentifier, previousButtonIdentifier, backButtonIdentifier, next_buttonIdentifier, itemList);

    this.type = "creatures";

    //Entry format= nr_available, name, buy_button
    const buyer_rows1 = getHtmlElementList(".nr_name_button_container.page_store > .nr_available_div");
    const buyer_rows2 = getHtmlElementList(".nr_name_button_container.page_store > .element_name_div");
    const buyer_rows3 = getHtmlElementList(".nr_name_button_container.page_store > .complementary_button");
    for (let i = 0; i < buyer_rows1.length; i++) {
      this.buyerRows.push([buyer_rows1[i], buyer_rows2[i], buyer_rows3[i]]);
    }
    this.backButton.style.cursor = "default";
    this.backButton.style.borderStyle = "none";
    this.backButton.innerHTML = "";

    this.initializeEventListenersChild();
  }
  initializeEventListenersChild() {
    //initialize buyer button's mouse envents
    for (let i = 0; i < this.buyerRows.length; i++) {
      this.buyerRows[i][2].addEventListener("click", () => {
        if (StorePage.buyers[StorePage.type][i].buy(StorePage.buyNumberValues[StorePage.currentBuyNumberButton[this.type]])) {
          this.populateElement(i);
        }
      });
    }
  }
  hideElement(elemNr: number) {
    super.hideElement(elemNr);
    this.elements[elemNr].hidden = true;
  }
  showElement(elemNr: number) {
    super.showElement(elemNr);
    this.elements[elemNr].hidden = false;
    this.elements[elemNr].style.cursor = "default";
  }
  elementMouseenter(elemNr: number) {
    StorePage.infoText.innerHTML = stuff[StorePage.type as keyof ArmyCompsI<never>][StorePage.buyers[this.type][elemNr].name].getText();
  }
  elementMouseleave(elemNr: number) {
    StorePage.infoText.innerHTML = "";
  }
  populateElement(elemNr: number) {
    const name = this.itemList[this.getItemListIndex(elemNr)].name;
    this.buyerRows[elemNr][1].innerHTML = name;
    const amount = Player.inventory[this.type as keyof ArmyCompsI<never>][name];
    if (amount) {
      this.buyerRows[elemNr][0].innerHTML = "(" + stylizeDecimals(amount, true) + ")";
    }
    else {
      this.buyerRows[elemNr][0].innerHTML = "(0)";
    }
    this.buyerRows[elemNr][2].innerHTML = stylizeDecimals(this.itemList[this.getItemListIndex(elemNr)].getPrice(StorePage.buyNumberValues[StorePage.currentBuyNumberButton[this.type]]));
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

  changeType(type: keyof ArmyCompsI<never>) {
    this.type = type;
  }

  changeSelection(type: keyof ArmyCompsI<never>, itemList: Buyer[]) {
    this.changeType(type);
    this.changeItemList(itemList);
  }
  changeItemList(itemList: any) {
    throw new Error("Method not implemented.");
  }
}

class StoreSubpageButtonGroupClass extends ButtonGroupClass {
  constructor(containerIdentifier: string, buttonIdentifier: string, selectedStyle: Object, defaultStyle: Object) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
  }

  showButton(buttonNr: number) {
    super.showButton(buttonNr);
    this.buttons[buttonNr].hidden = false;
  }
  hideButton(buttonNr: number) {
    super.hideButton(buttonNr);
    this.buttons[buttonNr].hidden = true;
  }
  buttonClick(buttonNr: number) {
    super.buttonClick(buttonNr);
    StorePage.changeSubpage(StorePage.subpageTypes[buttonNr]);
  }
}

class BuyNrButtonGroupClass extends ButtonGroupClass {
  constructor(containerIdentifier: string, buttonIdentifier: string, selectedStyle: Object, defaultStyle: Object) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
  }
  buttonClick(buttonNr: number) {
    super.buttonClick(buttonNr);
    StorePage.currentBuyNumberButton[StorePage.type] = buttonNr;
    StorePage.display();
  }
}

class StorePageClass extends PageClass {
  itemList: any;
  buyers: any;
  type: any;
  buyNumberValues: any;
  currentBuyNumberButton: any;
  infoText: any;
  subpageTypes: any;
  pageButton: any;
  subpageButtons: StoreSubpageButtonGroupClass;
  buyNumberButtons: BuyNrButtonGroupClass;
  constructor(name: string) {
    super(name);

    this.buyers = {
      "creatures": [new Buyer("creatures", "Human")],
      "weapons": [new Buyer("weapons", "Knife")],
    };
    this.pageButton = document.querySelector("#StorePageButton");
    this.subpageTypes = ["creatures", "weapons"];

    this.buyNumberValues = [new Decimal(1), new Decimal(10), new Decimal(100), new Decimal(1000)];
    this.currentBuyNumberButton = { "creatures": 0, "weapons": 0 };
    this.infoText = document.querySelector("#StorePageInfo");
    this.type = "creatures";
    this.itemList = new StoreItemListClass(".nr_name_button_flex_container.page_store", ".nr_name_button_container", ".element_list_prev_button", ".element_list_back_button", ".element_list_next_button", this.buyers[this.type]);
    this.subpageButtons = new StoreSubpageButtonGroupClass("#StoreSubpageButtons", ".select_button", { "borderColor": "var(--selected-toggle-button-border-color)" }, { "borderColor": "var(--default-toggle-button-border-color)" });
    this.buyNumberButtons = new BuyNrButtonGroupClass(".toggle_button_container.page_store", ".toggle_button", { "borderColor": "var(--selected-toggle-button-border-color)" }, { "borderColor": "var(--default-toggle-button-border-color)" });

    this.initializeEventListeners();
  }
  //called when page reloads
  initializeEventListeners() { }
  //called when new save gets loaded
  displayOnLoad() {
    this.buyNumberButtons.selectButton(this.currentBuyNumberButton[this.type]);
    this.itemList.changeItemList(this.buyers[this.type]);
  }
  display() {
    this.buyNumberButtons.selectButton(this.currentBuyNumberButton[this.type]);

    if (this.timesVisited == 0) {
      TutorialPage.unlockTutorial("Buy Creature Page");
      TutorialPage.startTutorial("Buy Creature Page", true, "StorePage");
    }
    this.timesVisited++;
    this.itemList.show();
    this.itemList.changePage(this.itemList.page);
  }
  displayEveryTick() { }
  //called when a save text is needed
  save() {
    let saveText = super.save();
    saveText += "/*/" + String(Object.keys(this.buyers).length);
    //save by subpage type
    for (const type of Object.keys(this.buyers)) {
      //save type name and what is current buy number button
      saveText += "/*/" + type + "/*/" + this.currentBuyNumberButton[type];
      //save buyer states (bought nr and the like)
      saveText += "/*/" + String(this.buyers[type].length);
      for (let i = 0; i < this.buyers[type].length; i++) {
        saveText += "/*/" + this.buyers[type][i].nrBought;
      }
    }
    saveText += "/*/" + this.subpageButtons.save();
    saveText += "/*/" + this.buyNumberButtons.save();
    return saveText;
  }
  //called when you need to get values from a saveText
  //returns the number of steps taken
  load(saveText: string) {
    const saveTextArr = saveText.split("/*/");
    let saveI = super.load(saveTextArr);
    let i = saveI ? saveI : 0;

    const page_nr = Number(saveTextArr[i]);
    i++;
    for (let ii = 0; ii < page_nr; ii++) {
      const type = saveTextArr[i]; i++;
      this.currentBuyNumberButton[type] = Number(saveTextArr[i]); i++;
      const buyer_nr = Number(saveTextArr[i]); i++;
      for (let iii = 0; iii < buyer_nr; iii++) {
        this.buyers[type][iii].nrBought = new Decimal(saveTextArr[i]);
        i++;
      }
    }
    i += this.subpageButtons.load(saveTextArr, i);
    i += this.buyNumberButtons.load(saveTextArr, i);
    return i;
  }
  changeSubpage(changeTo: number) {
    this.type = changeTo;
    this.itemList.changeSelection(this.type, this.buyers[this.type]);
    this.itemList.show(true);
    this.buyNumberButtons.buttonClick(this.currentBuyNumberButton[this.type]);
  }
}

export const StorePage = new StorePageClass("StorePage");