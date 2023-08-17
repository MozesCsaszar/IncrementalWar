import { GM } from '../../IncrementalWar';
import { ItemListClass, PageClass } from "../base_classes";
import { getHtmlElement } from "../functions";
import { TutorialItem } from '../tutorial';
import { StringHashT } from "../types";


class TutorialItemListClass extends ItemListClass<string> {
  //class names come in form of: .<name> or #<name>
  constructor(containerIdentifier: string, elementIdentifier: string,
    previousButtonIdentifier: string, backButtonIdentifier: string,
    next_buttonIdentifier: string, itemList: string[]) {
    super(containerIdentifier, elementIdentifier, previousButtonIdentifier, backButtonIdentifier, next_buttonIdentifier, itemList);
  }
  hideElement(elemNr: number) {
    super.hideElement(elemNr);
    this.elements[elemNr].innerHTML = '';
    this.elements[elemNr].style.borderStyle = 'none';
  }
  showElement(elemNr: number) {
    super.showElement(elemNr);
    this.elements[elemNr].style.borderStyle = 'solid';
  }
  elementClick(elemNr: number) {
    TutorialPage.startTutorial(TutorialPage.tutorialList.elements[elemNr].innerHTML, false, 'SettingsPage');
  }
  populateElement(elemNr: number) {
    this.elements[elemNr].innerHTML = this.itemList[this.getItemListIndex(elemNr)];
  }
  backButtonClick() {
    TutorialPage.exitTutorial();
  }
  hidePreviousButton() {
    super.hidePreviousButton();
    this.previousButton.style.borderStyle = 'none';
    this.previousButton.innerHTML = ''
  }
  showPreviousButton() {
    super.showPreviousButton();
    this.previousButton.style.borderStyle = 'solid';
    this.previousButton.innerHTML = '&lt;'
  }
  hideNextButton() {
    super.hideNextButton();
    this.nextButton.style.borderStyle = 'none';
    this.nextButton.innerHTML = ''
  }
  showNextButton() {
    super.showNextButton();
    this.nextButton.style.borderStyle = 'solid';
    this.nextButton.innerHTML = '&gt;'
  }

  show() {
    super.show(true);
  }
};

class TutorialPageClass extends PageClass {
  tutorialList: TutorialItemListClass;
  isMandatory: boolean = false;
  tutorialName: string = '';
  lastPage: string = '';
  currentEntry: number = 0;
  image: HTMLElement = getHtmlElement('.tutorial_image.page_tutorial');
  previousButton: HTMLElement = getHtmlElement('.tutorial_previous_button.page_tutorial');
  nextButton: HTMLElement = getHtmlElement('.tutorial_next_button.page_tutorial');
  tutorials: StringHashT<TutorialItem>;
  unlockedTutorials: Set<string> = new Set();
  defaultTutorialPath: string = './images/tutorial/';
  pageButtonsVisibility: boolean = false;
  constructor(name: string) {
    super(name);

    this.tutorialList = new TutorialItemListClass(
      '.element_list.page_tutorial', '.element_list_item', '.element_list_prev_button',
      '.element_list_back_button', '.element_list_next_button', []
    );
    this.tutorials = {
      'Settings Page': new TutorialItem('Settings Page', 1),
      'Army Page': new TutorialItem('Army Page', 3),
      'Buy Creature Page': new TutorialItem('Buy Creature Page', 2),
      'Buy Weapon Page': new TutorialItem('Buy Weapon Page', 1),
      'Tower Page': new TutorialItem('Tower Page', 3),
      'Boss Fighting Army Selection Page': new TutorialItem('Boss Fighting Army Selection Page', 1),
      'Boss Fighting Page': new TutorialItem('Boss Fighting Page', 1),
    };

    //call initializeEventListeners here
    this.initializeEventListeners();
  }
  //called when page reloads
  initializeEventListeners() {
    this.previousButton.addEventListener('click', () => {
      this.showPreviousEntry();
    });

    this.nextButton.addEventListener('click', () => {
      if (this.nextButton.innerHTML == 'Finish') {
        this.exitTutorial();
      }
      else {
        this.showNextEntry();
      }
    });
  }
  //called when new save gets loaded
  displayOnLoad() { }
  //called when page gets visible
  display() {
    this.tutorialList.changePage(0);
  }
  //call when
  displayEveryTick() { }
  //called when a save text is needed
  save() {
    let saveText = String(this.unlockedTutorials.size);
    for (let elem of this.unlockedTutorials) {
      saveText += '/*/' + elem;
    }
    return saveText;
  }
  //called when you need to get values from a saveText
  //maybe should call displayOnLoad?
  load(saveText: string) {
    const saveTextArr = saveText.split('/*/');
    let i = 0, j = 0;
    let len = Number(saveTextArr[i]);
    i++;
    while (j < len) {
      this.unlockedTutorials.add(saveTextArr[i]);
      i++; j++;
    }
    return i;
  }
  unlockTutorial(name: string) {
    this.unlockedTutorials.add(name);
  }
  getTutorialImageName() {
    return this.defaultTutorialPath + this.tutorialName + String(this.currentEntry) + '.png';
  }
  setUpSelectionList() {
    this.tutorialList.changeItemList(Array.from(this.unlockedTutorials.values()));
    this.tutorialList.show();
  }
  setTutorialButtons() {
    if (this.currentEntry == 0) {
      this.previousButton.hidden = true;
    }
    else {
      this.previousButton.hidden = false;
    }
    if (this.currentEntry == this.tutorials[this.tutorialName].nrPages - 1) {
      if (this.isMandatory) {
        this.nextButton.innerHTML = 'Finish';
      }
      else {
        this.nextButton.hidden = true;
      }
    }
    else {
      this.nextButton.hidden = false;
      this.nextButton.innerHTML = 'Next';
    }
  }
  setUpTutorial(tutorialName: string, isMandatory: boolean, lastPage: string) {
    this.lastPage = lastPage;
    this.isMandatory = isMandatory;
    this.tutorialName = tutorialName;
    //if the thing is mandatory, hide selection list
    if (isMandatory) {
      this.tutorialList.hide();
    }
    //if it is not mandatory, set up and show selection list
    else {
      this.setUpSelectionList();
    }
    if (tutorialName == 'None') {
      this.image.parentElement!.hidden = true;
      return;
    }
    else {
      this.image.parentElement!.hidden = false;
    }
    this.currentEntry = 0;
    this.image.setAttribute('src', this.getTutorialImageName());
    this.setTutorialButtons();
  }
  startTutorial(tutorialName: string, isMandatory: boolean, lastPage: string) {
    this.pageButtonsVisibility = getHtmlElement("#PageButtonsContainer").hidden;
    this.setUpTutorial(tutorialName, isMandatory, lastPage);
    getHtmlElement("#PageButtonsContainer").hidden = true;
    if (isMandatory) {
      GM.hidePages('TutorialPage');
    }
    else {
      this.pageButtonsVisibility = false;
    }
  }
  showPreviousEntry() {
    this.currentEntry--;
    this.image.setAttribute('src', this.getTutorialImageName());
    this.setTutorialButtons();
  }
  showNextEntry() {
    this.currentEntry++;
    this.image.setAttribute('src', this.getTutorialImageName());
    this.setTutorialButtons();
  }
  exitTutorial() {
    getHtmlElement('#PageButtonsContainer').hidden = this.pageButtonsVisibility;
    if (this.isMandatory) {
      this.tutorialList.hide();
    }
    GM.hidePages(this.lastPage);
  }
};

export const TutorialPage = new TutorialPageClass('TutorialPage');