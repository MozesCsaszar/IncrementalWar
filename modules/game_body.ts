class PageButtonsClass extends ButtonGroupClass {
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
    HidePages(this.buttons[buttonNr].getAttribute("page"));
  }
}

class GameBodyClass {
  pageButtons: any;
  constructor() {
    this.pageButtons = new PageButtonsClass("#AllPageButtons", ".page_button", { "borderColor": "var(--selected-page-button-border-color)" }, { "borderColor": "var(--default-page-button-border-color)" })
    this.resourceContainer = document.querySelector("#PageTopResourcesContainer");
  }
}

const GB = new GameBodyClass();