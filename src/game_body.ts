import { ButtonGroupClass, GameManagerClass } from "./base_classes";
import { getHtmlElement } from "./functions";

class PageButtonsClass extends ButtonGroupClass {
  gM: GameManagerClass;
  constructor(gM: GameManagerClass, containerIdentifier: string, buttonIdentifier:
    string, selectedStyle: Object, defaultStyle: Object) {
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
    this.gM.hidePages(this.buttons[buttonNr].getAttribute("page")!);
  }
}

export class GameBodyClass {
  resourceContainer: HTMLElement = getHtmlElement("#PageTopResourcesContainer");
  pageButtons: PageButtonsClass;
  gM: GameManagerClass;
  constructor(gM: GameManagerClass) {
    this.pageButtons = new PageButtonsClass(gM, "#AllPageButtons", ".page_button",
      { "borderColor": "var(--selected-page-button-border-color)" },
      { "borderColor": "var(--default-page-button-border-color)" }
    );
    this.gM = gM;
  }
}