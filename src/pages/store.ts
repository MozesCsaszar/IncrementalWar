//          BUY CREATURE PAGE
import Decimal from "break_infinity.js";
import { GameManagerClass } from "../base_classes";
import { ItemListClass, ButtonGroupClass, PageClass } from "../base_classes";
import { stuff } from "../data";
import { getHtmlElement, getHtmlElementList, stylizeDecimals } from "../functions";
import { ArmyCompsI } from "../types";
import { Buyer } from "../store";

class StoreItemListClass extends ItemListClass<Buyer> {
  type: keyof ArmyCompsI<never>;
  buyerRows: [HTMLElement, HTMLElement, HTMLElement][] = [];
  gM: GameManagerClass;
  //class names come in form of: .<name> or #<name>
  constructor(gM: GameManagerClass, containerIdentifier: string, elementIdentifier: string,
    previousButtonIdentifier: string, backButtonIdentifier: string,
    next_buttonIdentifier: string, itemList: Buyer[] = []) {
    super(containerIdentifier, elementIdentifier, previousButtonIdentifier, backButtonIdentifier, next_buttonIdentifier, itemList);

    this.gM = gM;
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
        if (this.gM.StorePage.buy(i, this.type)) {
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
    this.gM.StorePage.setInfoText(this.gM.StorePage.getBuyerText(elemNr));
  }
  elementMouseleave(elemNr: number) {
    this.gM.StorePage.setInfoText("");
  }
  populateElement(elemNr: number) {
    const name = this.itemList[this.getItemListIndex(elemNr)].name;
    this.buyerRows[elemNr][1].innerHTML = name;
    const amount = this.gM.Player.getElementCount(this.type, name);
    if (amount) {
      this.buyerRows[elemNr][0].innerHTML = "(" + stylizeDecimals(amount, true) + ")";
    }
    else {
      this.buyerRows[elemNr][0].innerHTML = "(0)";
    }
    const buyAmount: Decimal = this.gM.StorePage.getCurrentBuyNumber();
    this.buyerRows[elemNr][2].innerHTML = stylizeDecimals(this.itemList[this.getItemListIndex(elemNr)].getPrice(buyAmount));
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
  gM: GameManagerClass;
  constructor(gM: GameManagerClass, containerIdentifier: string,
    buttonIdentifier: string, selectedStyle: Object, defaultStyle: Object) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
    this.gM = gM;
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
    this.gM.StorePage.changeSubpage(buttonNr);
  }
}

class BuyNrButtonGroupClass extends ButtonGroupClass {
  gM: GameManagerClass;
  constructor(gM: GameManagerClass, containerIdentifier: string, buttonIdentifier: string,
    selectedStyle: Object, defaultStyle: Object) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
    this.gM = gM;
  }
  buttonClick(buttonNr: number) {
    super.buttonClick(buttonNr);
    this.gM.StorePage.setBuyNumberButton(buttonNr);
  }
}

export class StorePageClass extends PageClass {
  itemList: StoreItemListClass;
  buyers: ArmyCompsI<Buyer[]>;
  type: keyof ArmyCompsI<never>;
  buyNumberValues: Decimal[];
  currentBuyNumberButton: ArmyCompsI<number>;
  infoText: HTMLElement = getHtmlElement("#StorePageInfo");
  subpageTypes: (keyof ArmyCompsI<never>)[];
  pageButton: HTMLElement = getHtmlElement("#StorePageButton");
  subpageButtons: StoreSubpageButtonGroupClass;
  buyNumberButtons: BuyNrButtonGroupClass;
  constructor(name: string, gM: GameManagerClass) {
    super(name, gM);

    this.buyers = {
      "creatures": [new Buyer("creatures", "Human")],
      "weapons": [new Buyer("weapons", "Knife")],
    };
    this.subpageTypes = ["creatures", "weapons"];

    this.buyNumberValues = [new Decimal(1), new Decimal(10), new Decimal(100), new Decimal(1000)];
    this.currentBuyNumberButton = { "creatures": 0, "weapons": 0 };
    //currently selected type
    this.type = "creatures";
    this.itemList = new StoreItemListClass(
      gM, ".nr_name_button_flex_container.page_store",
      ".nr_name_button_container", ".element_list_prev_button", ".element_list_back_button",
      ".element_list_next_button", this.buyers[this.type]
    );
    this.subpageButtons = new StoreSubpageButtonGroupClass(
      gM, "#StoreSubpageButtons", ".select_button",
      { "borderColor": "var(--selected-toggle-button-border-color)" },
      { "borderColor": "var(--default-toggle-button-border-color)" }
    );
    this.buyNumberButtons = new BuyNrButtonGroupClass(
      gM, ".toggle_button_container.page_store", ".toggle_button",
      { "borderColor": "var(--selected-toggle-button-border-color)" },
      { "borderColor": "var(--default-toggle-button-border-color)" }
    );

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
      this.gM.TutorialPage.unlockTutorial("Buy Creature Page");
      this.gM.TutorialPage.startTutorial("Buy Creature Page", true, "StorePage");
    }
    this.timesVisited++;
    this.itemList.show();
    this.itemList.changePage(this.itemList.page);
  }
  //buy an element of the currently selected type at the index
  buy(index: number) {
    const buyer = this.buyers[this.type][index];
    return buyer.buy(this.buyNumberValues[this.currentBuyNumberButton[this.type]], this.gM);
  }
  displayEveryTick() { }
  //called when a save text is needed
  save() {
    let saveText = super.save();
    saveText += "/*/" + String(Object.keys(this.buyers).length);
    //save by subpage type
    for (const t of Object.keys(this.buyers)) {
      const type = t as keyof ArmyCompsI<never>;
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
      const type = saveTextArr[i] as keyof ArmyCompsI<never>; i++;
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
  changeSubpage(buttonNr: number) {
    this.type = this.subpageTypes[buttonNr];
    this.itemList.changeSelection(this.type, this.buyers[this.type]);
    this.itemList.show(true);
    this.buyNumberButtons.buttonClick(this.currentBuyNumberButton[this.type]);
  }
  getBuyerText(elemNr: number): string {
    return stuff[this.type][this.buyers[this.type][elemNr].name].getText();
  }
  setInfoText(text: string) {
    this.infoText.innerHTML = text;
  }
  getCurrentBuyNumber(): Decimal {
    return this.buyNumberValues[this.currentBuyNumberButton[this.type]];
  }
  setBuyNumberButton(buttonNr: number) {
    this.currentBuyNumberButton[this.type] = buttonNr;
    this.display();
  }
}