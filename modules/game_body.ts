import { GM } from "./main";
import { ButtonGroupClass } from "./base_classes";
import { getHtmlElement } from "./functions";

class PageButtonsClass extends ButtonGroupClass {
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
    GM.hidePages(this.buttons[buttonNr].getAttribute("page")!);
  }
}

class GameBodyClass {
  resourceContainer: HTMLElement = getHtmlElement("#PageTopResourcesContainer");
  pageButtons: any;
  constructor() {
    this.pageButtons = new PageButtonsClass("#AllPageButtons", ".page_button", { "borderColor": "var(--selected-page-button-border-color)" }, { "borderColor": "var(--default-page-button-border-color)" })
  }
}

export const GB = new GameBodyClass();