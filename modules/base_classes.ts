//FIGHTING RELATED
//CHANGE THIS PLACEMENT

import { Boss } from "./boss";

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
  constructor(bosses = [], maxSelectibleArmies: number, loseSoldiers: boolean) {
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
  container: HTMLElement | null;
  timesVisited: number;
  constructor(name: string) {
    this.name = name;
    this.container = document.getElementById(name + 'Container');
    this.timesVisited = 0;

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
  displayEveryTick(this) { }
  //called when a save text is needed
  save() {
    return String(this.timesVisited);
  }
  //called when you need to get values from a saveText
  //maybe should call displayOnLoad?
  //returns the number of steps taken
  load(saveText) {
    this.timesVisited = Number(saveText[0]);
    return 1;
  }
};

export class ItemListClass {
  container: any;
  elements: NodeListOf<Element>;
  elementsVisible: never[];
  previousButton: any;
  backButton: any;
  nextButton: any;
  buttonsVisible: boolean[];
  itemList: never[];
  page: number;
  //container: the container thisect, list_identifier: the identifier by which you can find the list container, the rest will be handled automatically
  constructor(containerIdentifier, element_idetifier, previous_buttonIdentifier, back_buttonIdentifier, next_buttonIdentifier, item_list = []) {
    this.container = document.querySelector(containerIdentifier);
    this.elements = document.querySelectorAll(containerIdentifier + ' > ' + element_idetifier);
    //for hiding elements and defining if the element is hidden or not
    this.elementsVisible = [];
    for (let i = 0; i < this.elements.length; i++) {
      this.elementsVisible.push(true);
    }
    this.previousButton = document.querySelector(containerIdentifier + ' > .element_list_buttons_container > ' + previous_buttonIdentifier);
    this.backButton = document.querySelector(containerIdentifier + ' > .element_list_buttons_container > ' + back_buttonIdentifier);
    this.nextButton = document.querySelector(containerIdentifier + ' > .element_list_buttons_container > ' + next_buttonIdentifier);
    this.buttonsVisible = [true, true, true];

    this.itemList = item_list;
    this.page = 0;

    this.initializeEventListeners();
  }

  get hidden() {
    return this.container.hidden;
  }

  initializeEventListeners() {
        let this = this;

    //item mouse functions (basically call ItemListClass functions for elements that are visible)
    for (let i = 0; i < this.elements.length; i++) {
      this.elements[i].addEventListener('mouseenter', function () {
        if (this.elementsVisible[i]) {
          this.elementMouseenter(i);
        }
      });
      this.elements[i].addEventListener('mouseleave', function () {
        if (this.elementsVisible[i]) {
          this.elementMouseleave(i);
        }
      });
      this.elements[i].addEventListener('click', function () {
        if (this.elementsVisible[i]) {
          this.elementClick(i);
        }
      });
    }
    this.previousButton.addEventListener('click', function () {
      if (this.buttonsVisible[0]) {
        this.previousButtonClick();
      }
    });
    this.backButton.addEventListener('mouseenter', function () {
      if (this.buttonsVisible[1]) {
        this.backButtonMouseenter();
      }
    });
    this.backButton.addEventListener('mouseleave', function () {
      if (this.buttonsVisible[1]) {
        this.backButtonMouseleave();
      }
    });
    this.backButton.addEventListener('click', function () {
      if (this.buttonsVisible[1]) {
        this.backButtonClick();
      }
    });
    this.nextButton.addEventListener('click', function () {
      if (this.buttonsVisible[2]) {
        this.nextButtonClick();
      }
    });
  }
  //calculates and returns the item's list index based on the current element and the current page
  getItemListIndex(elem_nr) {
    return this.page * this.elements.length + elem_nr;
  }
  changeItemList(item_list) {
    this.itemList = item_list;
  }
  changePage(pageNr) {
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
  show(do_reset) {
    if (do_reset) {
      this.reset();
    }
    this.container.hidden = false;
  }
  hide() {
    this.container.hidden = true;
  }
  //mouse events for individual elements on the list
  elementMouseenter(elem_nr) { }
  elementMouseleave(elem_nr) { }
  elementClick(elem_nr) { }
  //show/hide an element (can be done by using hidden, just disabling border and innerHTML = '' or anything else)
  showElement(elem_nr) {
    this.elementsVisible[elem_nr] = true;
    this.elements[elem_nr].style.cursor = 'pointer';
  }
  hideElement(elem_nr) {
    this.elementsVisible[elem_nr] = false;
    this.elements[elem_nr].style.cursor = 'default';
  }
  //populate an element with data
  populateElement(elem_nr) { }
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
  container: any;
  buttons: NodeListOf<Element>;
  selected: number;
  buttonsVisible: never[];
  selectedStyle: any;
  defaultStyle: any;
  constructor(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle) {
    this.container = document.querySelector(containerIdentifier);
    this.buttons = document.querySelectorAll(containerIdentifier + ' > ' + buttonIdentifier);

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
        let this = this;

    //button mouse events
    for (let i = 0; i < this.buttons.length; i++) {
      this.buttons[i].addEventListener('mouseenter', function () {
        if (this.buttonsVisible[i]) {
          this.buttonMouseenter(i);
        }
      });
      this.buttons[i].addEventListener('mouseleave', function () {
        if (this.buttonsVisible[i]) {
          this.buttonMouseleave(i);
        }
      });
      this.buttons[i].addEventListener('click', function () {
        if (this.buttonsVisible[i]) {
          this.buttonClick(i);
        }
      });
    }
  }

  buttonMouseenter(buttonNr) { }
  buttonMouseleave(buttonNr) { }
  selectButton(buttonNr) {
    for (let [key, value] of Object.entries(this.selectedStyle)) {
      this.buttons[buttonNr].style[key] = value;
    }
    this.selected = buttonNr;
  }

  buttonClick(buttonNr) {
    if (buttonNr != this.selected) {
      //restore previously selected to default appearance
      for (let [key, value] of Object.entries(this.defaultStyle)) {
        this.buttons[this.selected].style[key] = value;
      }
      //change newly selected to selected appearance
      this.selectButton(buttonNr);
    }
  }
  showButton(buttonNr) {
    this.buttonsVisible[buttonNr] = true;
  }
  hideButton(buttonNr) {
    this.buttonsVisible[buttonNr] = false;
  }

  //returns save text in which the state of the buttons was saved
  save() {
    let saveText = String(this.selected);

    return saveText;
  }
  //will load itself from saveText, starting at index i
  //returns number of steps taken (fields used) in saveText
  load(saveText, i) {
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