class TutorialItem {
  constructor(name, nr_pages) {
    this.name = name;
    this.nr_pages = nr_pages;
  }
};

class TutorialItemListClass extends ItemListClass {
  //class names come in form of: .<name> or #<name>
  constructor(containerIdentifier, elementIdentifier, previousButtonIdentifier, backButtonIdentifier, next_buttonIdentifier, itemList) {
    super(containerIdentifier, elementIdentifier, previousButtonIdentifier, backButtonIdentifier, next_buttonIdentifier, itemList);
  }
  hideElement(elemNr) {
    super.hideElement(elemNr);
    this.elements[elemNr].innerHTML = '';
    this.elements[elemNr].style.borderStyle = 'none';
  }
  showElement(elemNr) {
    super.showElement(elemNr);
    this.elements[elemNr].style.borderStyle = 'solid';
  }
  elementClick(elemNr) {
    TutorialPage.startTutorial(TutorialPage.tutorialList.elements[elemNr].innerHTML, false, 'SettingsPage');
  }
  populateElement(elemNr) {
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
  constructor(name) {
    super(name);
    this.isMandatory = false;
    this.tutorialName = '';
    this.lastPage = undefined;
    this.currentEntry = 0;
    this.tutorialList = new TutorialItemListClass('.element_list.page_tutorial', '.element_list_item', '.element_list_prev_button', '.element_list_back_button', '.element_list_next_button', []);
    this.image = document.querySelector('.tutorial_image.page_tutorial');
    this.previousButton = document.querySelector('.tutorial_previous_button.page_tutorial');
    this.nextButton = document.querySelector('.tutorial_next_button.page_tutorial');
    this.tutorials = {
      'Settings Page': new TutorialItem('Settings Page', 1),
      'Army Page': new TutorialItem('Army Page', 3),
      'Buy Creature Page': new TutorialItem('Buy Creature Page', 2),
      'Buy Weapon Page': new TutorialItem('Buy Weapon Page', 1),
      'Tower Page': new TutorialItem('Tower Page', 3),
      'Boss Fighting Army Selection Page': new TutorialItem('Boss Fighting Army Selection Page', 1),
      'Boss Fighting Page': new TutorialItem('Boss Fighting Page', 1),
    };
    this.unlockedTutorials = new Set();
    this.defaultTutorialPath = './images/tutorial/';
    this.pageButtonsVisibility = false;

    //call initializeEventListeners here
    this.initializeEventListeners();
  }
  //called when page reloads
  initializeEventListeners() {
        let this = this;

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
  displayEveryTick(this) { }
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
  load(saveText) {
    saveText = saveText.split('/*/');
    let i = 0, j = 0;
    let len = Number(saveText[i]);
    i++;
    while (j < len) {
      this.unlockedTutorials.add(saveText[i]);
      i++; j++;
    }
  }
  unlockTutorial(name) {
    this.unlockedTutorials.add(name);
  }
  getTutorialImageName() {
    return this.defaultTutorialPath + this.tutorialName + String(this.currentEntry) + '.png';
  }
  setUpSelectionList() {
    this.tutorialList.changeItemList(Array.from(this.unlockedTutorials.values()));
    this.tutorialList.show(true);
  }
  setTutorialButtons() {
    if (this.currentEntry == 0) {
      this.previousButton.hidden = true;
    }
    else {
      this.previousButton.hidden = false;
    }
    if (this.currentEntry == this.tutorials[this.tutorialName].nr_pages - 1) {
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
  setUpTutorial(tutorial_name, is_mandatory, last_page) {
    this.lastPage = last_page;
    this.isMandatory = is_mandatory;
    this.tutorialName = tutorial_name;
    //if the thing is mandatory, hide selection list
    if (is_mandatory) {
      this.tutorialList.hide();
    }
    //if it is not mandatory, set up and show selection list
    else {
      this.setUpSelectionList();
    }
    if (tutorial_name == 'None') {
      this.image.parentElement.hidden = true;
      return;
    }
    else {
      this.image.parentElement.hidden = false;
    }
    this.currentEntry = 0;
    this.image.setAttribute('src', this.getTutorialImageName());
    this.setTutorialButtons();
  }
  startTutorial(tutorial_name, is_mandatory, last_page) {
    this.pageButtonsVisibility = document.querySelector("#PageButtonsContainer").hidden;
    this.setUpTutorial(tutorial_name, is_mandatory, last_page);
    document.querySelector("#PageButtonsContainer").hidden = true;
    if (is_mandatory) {
      HidePages('TutorialPage');
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
    document.querySelector('#PageButtonsContainer').hidden = this.pageButtonsVisibility;
    if (this.isMandatory) {
      this.tutorialList.hide();
    }
    HidePages(this.lastPage);
  }
};

let TutorialPage = new TutorialPageClass('TutorialPage');