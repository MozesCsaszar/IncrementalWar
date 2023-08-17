import Decimal from "break_infinity.js";
import { getHtmlElement, getHtmlElementList } from "./functions";
import { ArmyCompsI, StringHashT } from "./types";

//Provides get and set methods
export class HashLike {
  get<T>(key: string): T {
    return this[key as keyof HashLike] as T;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, value: any) {
    this[key as keyof HashLike] = value;
  }
}

/*
    bosses - the names of the bosses from stuff which you need to fight
    maxSelectibleArmies - max number of armies the player can bring to the fight
    loseSoldiers - true if you lose soldiers based on the soldierLossRatio of the boss you are fighting
                    false if you don't lose soldiers no matter what
*/
export class Fight {
  bosses: string[];
  maxSelectibleArmies: number;
  loseSoldiers: boolean;
  selectedArmies: number[];
  constructor(bosses: string[] = [], maxSelectibleArmies: number, loseSoldiers: boolean) {
    this.bosses = bosses;
    this.maxSelectibleArmies = maxSelectibleArmies;
    this.loseSoldiers = loseSoldiers;
    //initialize selected armies
    this.selectedArmies = []
    for (let i = 0; i < maxSelectibleArmies; i++) {
      this.selectedArmies.push(-1);
    }
  }
}

//A base Page class which has all the functions and values necessary for it to work
export class PageClass {
  name: string;
  container: HTMLElement;
  timesVisited: number;
  gM: GameManagerClass;
  constructor(name: string, gM: GameManagerClass) {
    this.name = name;
    this.container = $(name + 'Container').get(0)!;
    this.timesVisited = 0;
    this.gM = gM;

    //call initializeEventListeners here
  }

  //functions to hide/show page by containers hidden value to make use easier
  get hidden() {
    return this.container.hidden;
  }
  set hidden(val) {
    this.container.hidden = val;
  }
  //called when page reloads
  initializeEventListeners() { }
  //called when new save gets loaded
  displayOnLoad() { }
  //called when page gets visible
  display() { }
  //call when displaying every tick; needs this as self so that it can access stuff in itself
  displayEveryTick() { }
  //called when a save text is needed
  save() {
    return String(this.timesVisited);
  }
  //called when you need to get values from a saveText
  //maybe should call displayOnLoad?
  //returns the number of steps taken
  load(saveText: string | string[]): number | void {
    this.timesVisited = Number(saveText[0]);
    return 1;
  }
};

export class ItemListClass<T> {
  container: HTMLElement;
  elements: HTMLElement[];
  elementsVisible: boolean[];
  previousButton: HTMLElement;
  backButton: HTMLElement;
  nextButton: HTMLElement;
  buttonsVisible: boolean[];
  itemList: T[];
  page: number;
  //container: the container thisect, list_identifier: the identifier by which you can find the list container, the rest will be handled automatically
  constructor(containerIdentifier: string, elementIdentifier: string,
    previousButtonIdentifier: string, backButtonIdentifier: string,
    next_buttonIdentifier: string, itemList: T[] = []) {
    this.container = $(containerIdentifier).get(0)!;
    this.elements = $(containerIdentifier + ' > ' + elementIdentifier).toArray();
    //for hiding elements and defining if the element is hidden or not
    this.elementsVisible = [];
    for (let i = 0; i < this.elements.length; i++) {
      this.elementsVisible.push(true);
    }
    const prevButtonId = containerIdentifier + ' > .element_list_buttons_container > ' + previousButtonIdentifier;
    const backButtonId = containerIdentifier + ' > .element_list_buttons_container > ' + backButtonIdentifier
    const nextButtonId = containerIdentifier + ' > .element_list_buttons_container > ' + next_buttonIdentifier
    this.previousButton = getHtmlElement(prevButtonId);
    this.backButton = getHtmlElement(backButtonId);
    this.nextButton = getHtmlElement(nextButtonId);
    this.buttonsVisible = [true, true, true];

    this.itemList = itemList;
    this.page = 0;

    this.initializeEventListeners();
  }

  get hidden() {
    return this.container.hidden;
  }

  initializeEventListeners() {
    //item mouse functions (basically call ItemListClass functions for elements that are visible)
    for (let i = 0; i < this.elements.length; i++) {
      this.elements[i].addEventListener('mouseenter', () => {
        if (this.elementsVisible[i]) {
          this.elementMouseenter(i);
        }
      });
      this.elements[i].addEventListener('mouseleave', () => {
        if (this.elementsVisible[i]) {
          this.elementMouseleave(i);
        }
      });
      this.elements[i].addEventListener('click', () => {
        if (this.elementsVisible[i]) {
          this.elementClick(i);
        }
      });
    }
    this.previousButton.addEventListener('click', () => {
      if (this.buttonsVisible[0]) {
        this.previousButtonClick();
      }
    });
    this.backButton.addEventListener('mouseenter', () => {
      if (this.buttonsVisible[1]) {
        this.backButtonMouseenter();
      }
    });
    this.backButton.addEventListener('mouseleave', () => {
      if (this.buttonsVisible[1]) {
        this.backButtonMouseleave();
      }
    });
    this.backButton.addEventListener('click', () => {
      if (this.buttonsVisible[1]) {
        this.backButtonClick();
      }
    });
    this.nextButton.addEventListener('click', () => {
      if (this.buttonsVisible[2]) {
        this.nextButtonClick();
      }
    });
  }
  //calculates and returns the item's list index based on the current element and the current page
  getItemListIndex(elemNr: number) {
    return this.page * this.elements.length + elemNr;
  }
  changeItemList(itemList: T[]) {
    this.itemList = itemList;
  }
  changePage(pageNr: number) {
    this.page = pageNr;
    for (let i = 0; i < this.elements.length; i++) {
      //if index is alright, populate and display element
      if (this.getItemListIndex(i) < this.itemList.length) {
        this.populateElement(i);
        this.showElement(i);
      }
      //else hide it
      else {
        this.hideElement(i);
      }
    }
    this.showHidePreviousNextButton();
  }
  //reset the list to page 0 and show it again
  reset() {
    this.page = 0;
    this.changePage(0);
  }
  //show and hide list
  show(doReset: boolean = false) {
    if (doReset) {
      this.reset();
    }
    this.container.hidden = false;
  }
  hide() {
    this.container.hidden = true;
  }
  //mouse events for individual elements on the list
  elementMouseenter(elemNr: number) { }
  elementMouseleave(elemNr: number) { }
  elementClick(elemNr: number) { }
  //show/hide an element (can be done by using hidden, just disabling border and innerHTML = '' or anything else)
  showElement(elemNr: number) {
    this.elementsVisible[elemNr] = true;
    this.elements[elemNr].style.cursor = 'pointer';
  }
  hideElement(elemNr: number) {
    this.elementsVisible[elemNr] = false;
    this.elements[elemNr].style.cursor = 'default';
  }
  //populate an element with data
  populateElement(elemNr: number) { }
  //back button events
  backButtonMouseenter() { }
  backButtonMouseleave() { }
  hideBackButton() {
    this.buttonsVisible[1] = false;
  }
  showBackButton() {
    this.buttonsVisible[1] = true;
  }
  backButtonClick() {
    //just hide the back button
    this.hide();
  }
  //previous and next item list page button click event
  hidePreviousButton() {
    this.previousButton.style.cursor = 'default';
    this.buttonsVisible[0] = false;
  }
  showPreviousButton() {
    this.previousButton.style.cursor = 'pointer';
    this.buttonsVisible[0] = true;
  }
  previousButtonClick() {
    if (this.page > 0) {
      this.changePage(this.page - 1);
    }
    this.showHidePreviousNextButton();
  }
  hideNextButton() {
    this.nextButton.style.cursor = 'default';
    this.buttonsVisible[2] = false;
  }
  showNextButton() {
    this.nextButton.style.cursor = 'pointer';
    this.buttonsVisible[0] = true;
  }
  nextButtonClick() {
    if ((this.page + 1) * this.elements.length < this.itemList.length) {
      this.changePage(this.page + 1);
    }
    this.showHidePreviousNextButton();
  }
  //handle hidden/visible states for previous and next button
  showHidePreviousNextButton() {
    //show previous button if there is a page to go back
    if (this.page > 0) {
      this.showPreviousButton();
    }
    //else hide previous button
    else {
      this.hidePreviousButton();
    }
    //show next page button if there is a page to go forwards to
    if ((this.page + 1) * this.elements.length < this.itemList.length) {
      this.showNextButton();
    }
    //else just hide it
    else {
      this.hideNextButton();
    }

  }
};

//style is an thisect with keys naming the style thisect(like borderColor, width etc.) and value is the value it needs to be substituted with
export class ButtonGroupClass {
  container: HTMLElement;
  buttons: HTMLElement[];
  selected: number;
  buttonsVisible: boolean[];
  selectedStyle: Object;
  defaultStyle: Object;
  constructor(containerIdentifier: string, buttonIdentifier: string, selectedStyle: Object, defaultStyle: Object) {
    this.container = getHtmlElement(containerIdentifier);
    this.buttons = getHtmlElementList(containerIdentifier + ' > ' + buttonIdentifier);

    this.selected = 0;
    this.buttonsVisible = [];
    for (let i = 0; i < this.buttons.length; i++) {
      this.buttonsVisible.push(true);
    }

    this.selectedStyle = selectedStyle;
    this.defaultStyle = defaultStyle;

    this.initializeEventListeners();
  }

  get hidden() {
    return this.container.hidden;
  }
  set hidden(val) {
    this.container.hidden = val;
  }

  initializeEventListeners() {
    //button mouse events
    for (let i = 0; i < this.buttons.length; i++) {
      this.buttons[i].addEventListener('mouseenter', () => {
        if (this.buttonsVisible[i]) {
          this.buttonMouseenter(i);
        }
      });
      this.buttons[i].addEventListener('mouseleave', () => {
        if (this.buttonsVisible[i]) {
          this.buttonMouseleave(i);
        }
      });
      this.buttons[i].addEventListener('click', () => {
        if (this.buttonsVisible[i]) {
          this.buttonClick(i);
        }
      });
    }
  }

  buttonMouseenter(buttonNr: number) { }
  buttonMouseleave(buttonNr: number) { }
  selectButton(buttonNr: number) {
    for (let key in this.selectedStyle) {
      // this.buttons[buttonNr].style[key as keyof CSSStyleDeclaration] = this.selectedStyle[key as keyof Object];
    }
    this.selected = buttonNr;
  }

  buttonClick(buttonNr: number) {
    if (buttonNr != this.selected) {
      //restore previously selected to default appearance
      // for (let [key, value] of Object.entries(this.defaultStyle)) {
      //   this.buttons[this.selected].style[key] = value;
      // }
      //change newly selected to selected appearance
      this.selectButton(buttonNr);
    }
  }
  showButton(buttonNr: number) {
    this.buttonsVisible[buttonNr] = true;
  }
  hideButton(buttonNr: number) {
    this.buttonsVisible[buttonNr] = false;
  }

  //returns save text in which the state of the buttons was saved
  save() {
    let saveText = String(this.selected);

    return saveText;
  }
  //will load itself from saveText, starting at index i
  //returns number of steps taken (fields used) in saveText
  load(saveText: string[], i: number) {
    this.selected = Number(saveText[i]) == 0 ? 1 : 0;
    this.buttonClick(Number(saveText[i]));
    return 1;
  }

  //functions to show/hide the button group
  show() {
    this.container.hidden = false;
  }
  hide() {
    this.container.hidden = true;
  }
}

declare class TutorialPageClass {
  startTutorial(tutorialName: string, isMandatory: boolean, lastPage: string): void;
  unlockTutorial(name: string): void;
  exitTutorial(): void;
  startTutorialByElemNr(elemNr: number, isMandatory: boolean, lastPage: string): void;
}

declare class Buyer {

}

declare class StorePageClass {
  infoText: HTMLElement;
  itemList: ItemListClass<Buyer>;
  buy(index: number, type: keyof ArmyCompsI<never>): boolean;
  changeSubpage(buttonNr: number): void;
  getBuyerText(elemNr: number): string;
  setInfoText(text: string): void;
  getCurrentBuyNumber(): Decimal;
  setBuyNumberButton(buttonNr: number): void;
}

declare class ArmyPageClass {
  currentArmy: number;
  armyManagerContainer: HTMLElement;
  armySizeInput: HTMLInputElement;
  setElementEquipState(type: keyof ArmyCompsI<never>, name: string, newState: number): void;
  changeArmy(armyNr: number): void;
  setPartInfoText(text: string): void;
  setInfoText(text: string): void;
  getSelectRowsElement(type: keyof ArmyCompsI<never>, index: number, row: number): HTMLElement;
  equipElementByArmy(type: keyof ArmyCompsI<never>, element: string, armyNr: number): void;
  deequipElementByArmy(type: keyof ArmyCompsI<never>, element: string, armyNr: number): void;
}

declare class Army {
  weapons: string[];
  creature: string;
  level: number;
  size: Decimal;
  maxWeapons: number;
  setSize(newSize: Decimal): void;
  getChangeText(type: keyof ArmyCompsI<never>, changeTo: string, changeIndex: number): string;
  getText(): string;
  changeElement(type: string, changeTo: string,
    changeIndex: number, unlockStuff: boolean, armyNr: number): boolean;
  getLevelUpText(): string;
  getCompareLevelText(): string;
  levelUp(): void;
}

export declare class PlayerClass extends HashLike {
  armies: Army[];
  gold: Decimal;
  save(): string;
  load(saveText: string): void;
  getElementCount(type: keyof ArmyCompsI<never>, name: string): Decimal;
  setElementCount(type: keyof ArmyCompsI<never>, name: string, newValue: Decimal): void;
  getArmy(index: number): Army;
};

export declare class GameManagerClass {
  Player: PlayerClass;
  pages: StringHashT<PageClass>;
  currentPage: string;
  canSave: boolean;
  TutorialPage: TutorialPageClass;
  StorePage: StorePageClass;
  ArmyPage: ArmyPageClass;
  hidePages(page: string): void;
  loadOfflineProgress(nrMiliseconds: number): void;
};