//          BUY CREATURE PAGE

class Buyer {
  borderColors = {
    "gold": "gold",
  };

  constructor(type, name, currency = "gold", nr_bought = new Decimal(0)) {
    this.type = type;
    this.name = name;
    this.nr_bought = nr_bought;
    this.currency = currency;
  }

  buy(buy_nr) {
    const price = stuff[this.type][this.name].getPrice(this.nr_bought, buy_nr);
    if (Player[this.currency].gte(price)) {
      Player[this.currency] = Player[this.currency].sub(price);
      //when adding a new element
      if (!Player.inventory[this.type][this.name]) {
        ArmyPage.elementEquipState[this.type][this.name] = 0;
        Player.inventory[this.type][this.name] = new Decimal(0);
      }
      Player.inventory[this.type][this.name] = Player.inventory[this.type][this.name].add(buy_nr);
      this.nr_bought = this.nr_bought.add(buy_nr);
      if (allThingsStatistics.addToStatistics(["StorePage", this.type, this.name], buy_nr)) {
        StorePage.itemList.changePage(StorePage.itemList.page);
      }
      return true;
    }
    return false;
  }

  getPrice(buy_nr) {
    return stuff[this.type][this.name].getPrice(this.nr_bought, buy_nr);
  }
}

class StoreItemListClass extends ItemListClass {
  //class names come in form of: .<name> or #<name>
  constructor(containerIdentifier, element_idetifier, previous_buttonIdentifier, back_buttonIdentifier, next_buttonIdentifier, item_list = []) {
    super(containerIdentifier, element_idetifier, previous_buttonIdentifier, back_buttonIdentifier, next_buttonIdentifier, item_list);

    this.type = "creatures";

    //Entry format= nr_available, name, buy_button
    this.buyerRows = [];
    const buyer_rows1 = document.querySelectorAll(".nr_name_button_container.page_store > .nr_available_div");
    const buyer_rows2 = document.querySelectorAll(".nr_name_button_container.page_store > .element_name_div");
    const buyer_rows3 = document.querySelectorAll(".nr_name_button_container.page_store > .complementary_button");
    for (let i = 0; i < buyer_rows1.length; i++) {
      this.buyerRows.push([buyer_rows1[i], buyer_rows2[i], buyer_rows3[i]]);
    }
    this.backButton.style.cursor = "default";
    this.backButton.style.borderStyle = "none";
    this.backButton.innerHTML = "";

    this.initializeEventListenersChild();
  }
  initializeEventListenersChild() {
    const this = this;

    //initialize buyer button's mouse envents
    for (let i = 0; i < this.buyerRows.length; i++) {
      this.buyerRows[i][2].addEventListener("click", () => {
        if (StorePage.buyers[StorePage.type][i].buy(StorePage.buyNumberValues[StorePage.currentBuyNumberButton[this.type]])) {
          this.populateElement(i);
        }
      });
    }
  }
  hideElement(elem_nr) {
    super.hideElement(elem_nr);
    this.elements[elem_nr].hidden = true;
  }
  showElement(elem_nr) {
    super.showElement(elem_nr);
    this.elements[elem_nr].hidden = false;
    this.elements[elem_nr].style.cursor = "default";
  }
  elementMouseenter(elem_nr) {
    StorePage.infoText.innerHTML = stuff[StorePage.type][StorePage.buyers[this.type][elem_nr].name].getText();
  }
  elementMouseleave(elem_nr) {
    StorePage.infoText.innerHTML = "";
  }
  populateElement(elem_nr) {
    const name = this.itemList[this.getItemListIndex(elem_nr)].name;
    this.buyerRows[elem_nr][1].innerHTML = name;
    this.buyerRows[elem_nr][0].innerHTML = (Player.inventory[this.type][name] ? "(" + StylizeDecimals(Player.inventory[this.type][name], true) + ")" : "(0)");
    this.buyerRows[elem_nr][2].innerHTML = StylizeDecimals(this.itemList[this.getItemListIndex(elem_nr)].getPrice(StorePage.buyNumberValues[StorePage.currentBuyNumberButton[this.type]]));
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

  changeSelection(type, item_list) {
    this.changeType(type);
    this.changeItemList(item_list);
  }
}

class StoreSubpageButtonGroupClass extends ButtonGroupClass {
  constructor(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
  }

  showButton(buttonNr) {
    super.showButton(buttonNr);
    this.buttons[buttonNr].hidden = false;
  }
  hideButton(buttonNr) {
    super.hideButton(buttonNr);
    this.buttons[buttonNr].hidden = true;
  }
  buttonClick(buttonNr) {
    super.buttonClick(buttonNr);
    StorePage.changeSubpage(StorePage.subpageTypes[buttonNr]);
  }
}

class BuyNrButtonGroupClass extends ButtonGroupClass {
  constructor(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
  }
  buttonClick(buttonNr) {
    super.buttonClick(buttonNr);
    StorePage.currentBuyNumberButton[StorePage.type] = buttonNr;
    StorePage.display();
  }
}

class StorePageClass extends PageClass {
  constructor(name) {
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
  initializeEventListeners() {
    const this = this;
  }
  //called when new save gets loaded
  displayOnLoad() {
    this.buyNumberButtons[this.currentBuyNumberButton[this.type]].style.borderColor = "var(--selected-toggle-button-border-color)";
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
  displayEveryTick(this) {

  }
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
        saveText += "/*/" + this.buyers[type][i].nr_bought;
      }
    }
    saveText += "/*/" + this.subpageButtons.save();
    saveText += "/*/" + this.buyNumberButtons.save();
    return saveText;
  }
  //called when you need to get values from a saveText
  //returns the number of steps taken
  load(saveText) {
    saveText = saveText.split("/*/");
    let i = super.load(saveText);

    const page_nr = Number(saveText[i]);
    i++;
    for (let ii = 0; ii < page_nr; ii++) {
      const type = saveText[i]; i++;
      this.currentBuyNumberButton[type] = Number(saveText[i]); i++;
      const buyer_nr = Number(saveText[i]); i++;
      for (let iii = 0; iii < buyer_nr; iii++) {
        this.buyers[type][iii].nr_bought = new Decimal(saveText[i]);
        i++;
      }
    }
    i += this.subpageButtons.load(saveText, i);
    i += this.buyNumberButtons.load(saveText, i);
  }
  changeSubpage(changeTo) {
    this.type = changeTo;
    this.itemList.changeSelection(this.type, this.buyers[this.type]);
    this.itemList.show(true);
    this.buyNumberButtons.buttonClick(this.currentBuyNumberButton[this.type]);
  }
}

const StorePage = new StorePageClass("StorePage");